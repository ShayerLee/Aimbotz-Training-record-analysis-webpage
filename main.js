// 本地存储键
const STORAGE_KEY = 'aimbotz_local_data_tables';
const PROJECT_SETTINGS_KEY = 'aimbotz_project_settings';


var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?bdc9a25d71cbcac2f9c05e80de0e0336";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();


// 项目设置
let currentProject = {
  name: '',
  weapon: '',
  scope: 'normal',
  killCount: 100
};
// 表头定义
const COLUMNS = [
  { key: 'trainTime', label: '训练时间' },
  { key: 'finishTime', label: '完成时间' },
  { key: 'killsPerMin', label: '每分钟击杀' },
  { key: 'killsPerSec', label: '每秒击杀' },
  { key: 'shotsPerKill', label: '准确率' },
  { key: 'stopSuccessRate', label: '急停成功率' },
  { key: 'stopKillRate', label: '急停击杀率' }
];
const CHARTS = [
  { key: 'finishTime', label: '完成时间', yLabel: '秒', parser: v => timeStrToSeconds(v) },
  { key: 'killsPerMin', label: '每分钟击杀', yLabel: '数值', parser: v => parseFloat(v) },
  { key: 'killsPerSec', label: '每秒击杀', yLabel: '数值', parser: v => parseFloat(v) },
  { key: 'shotsPerKill', label: '准确率', yLabel: '数值', parser: v => parseFloat(v) },
  { key: 'stopSuccessRate', label: '急停成功率', yLabel: '数值', parser: v => (v!==undefined && v!==null && v!=='' && !isNaN(parseFloat(v)) ? parseFloat(v) : null) },
  { key: 'stopKillRate', label: '急停击杀率', yLabel: '数值', parser: v => (v!==undefined && v!==null && v!=='' && !isNaN(parseFloat(v)) ? parseFloat(v) : null) }
];
// 本地存储操作
function loadTables() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}
function saveTables(tables) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
  showSaveTip();
}

// 项目设置操作
function loadProjectSettings() {
  const saved = localStorage.getItem(PROJECT_SETTINGS_KEY);
  if (saved) {
    currentProject = { ...currentProject, ...JSON.parse(saved) };
  }
  updateProjectInfoDisplay();
}

function loadProjectSettingsByName(projectName) {
  const saved = localStorage.getItem(`project_settings_${projectName}`);
  if (saved) {
    currentProject = { ...currentProject, ...JSON.parse(saved) };
  } else {
    // 如果没有保存的设置，使用默认值
    currentProject.name = projectName;
    currentProject.weapon = '';
    currentProject.killCount = 100;
  }
}

function saveProjectSettings() {
  localStorage.setItem(PROJECT_SETTINGS_KEY, JSON.stringify(currentProject));
  // 同时保存到项目特定的存储
  if (currentProject.name) {
    localStorage.setItem(`project_settings_${currentProject.name}`, JSON.stringify(currentProject));
  }
  updateProjectInfoDisplay();
  showSaveTip();
}
// 工具函数
function pad(n) { return n < 10 ? '0' + n : n; }
function formatDate(dt) {
  return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()) + ' ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
}
function formatDateLocal(dt) {
  return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()) + 'T' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
}
function timeStrToSeconds(str) {
  if (!str) return 0;
  let m = str.match(/(\d+):(\d+)(?:\.(\d+))?/);
  if (!m) return parseFloat(str) || 0;
  return parseInt(m[1]) * 60 + parseInt(m[2]) + (m[3] ? parseFloat('0.' + m[3]) : 0);
}
function secondsToTimeStr(sec) {
  let m = Math.floor(sec / 60), s = (sec % 60).toFixed(3);
  return pad(m) + ':' + pad(Math.floor(s)) + '.' + (s.split('.')[1] || '000');
}

// 武器基准速度配置
const WEAPON_SPEEDS = {
  // 手枪
  'usp': 240, 'glock': 240, 'p2000': 240, 'p250': 240, 'dual_berettas': 240, 'fn57': 240, 'tec9': 240, 'cz75': 240,
  'deagle': 230, 'r8': 220, 'taser': 230,
  // 冲锋枪
  'mac10': 240, 'mp9': 240, 'bizon': 240, 'mp5': 235, 'ump45': 230, 'p90': 230, 'mp7': 220,
  // 步枪
  'm4a1': 225, 'm4a4': 225, 'famas': 220, 'aug': 220, 'ak47': 215, 'galil': 215, 'sg553': 210,
  // 狙击枪
  'ssg08': 230, 'awp': 200, 'scar20': 215, 'g3sg1': 215,
  // 霰弹枪
  'nova': 225, 'xm1014': 220, 'mag7': 215, 'sawedoff': 210,
  // 机枪
  'm249': 195, 'negev': 150
};

// 武器开镜速度配置
const WEAPON_SCOPED_SPEEDS = {
  'aug': 150, 'sg553': 150, 'awp': 100, 'scar20': 120, 'g3sg1': 120
};

// 获取武器显示名称
function getWeaponDisplayName(weaponKey) {
  const weaponNames = {
    'usp': 'USP',
    'glock': lang === 'zh' ? '格洛克' : lang === 'ru' ? 'Глок' : 'Glock',
    'p2000': 'P2000',
    'p250': 'P250',
    'dual_berettas': lang === 'zh' ? '双持瑞贝塔' : lang === 'ru' ? 'Двойные Беретты' : 'Dual Berettas',
    'fn57': 'FN57',
    'tec9': 'Tec9',
    'cz75': 'CZ75',
    'deagle': lang === 'zh' ? '沙鹰' : lang === 'ru' ? 'Пустынный Орел' : 'Desert Eagle',
    'r8': 'R8',
    'taser': lang === 'zh' ? '电击枪' : lang === 'ru' ? 'Электрошокер' : 'Taser',
    'mac10': 'MAC10',
    'mp9': 'MP9',
    'bizon': lang === 'zh' ? '野牛' : lang === 'ru' ? 'Бизон' : 'Bizon',
    'mp5': 'MP5',
    'ump45': 'UMP45',
    'p90': 'P90',
    'mp7': 'MP7',
    'm4a1': 'M4A1',
    'm4a4': 'M4A4',
    'famas': lang === 'zh' ? '法玛斯' : lang === 'ru' ? 'Фамас' : 'Famas',
    'aug': 'AUG',
    'ak47': 'AK47',
    'galil': lang === 'zh' ? '咖喱' : lang === 'ru' ? 'Галил' : 'Galil',
    'sg553': '553',
    'ssg08': lang === 'zh' ? '鸟狙' : lang === 'ru' ? 'Снайперка' : 'SSG08',
    'awp': lang === 'zh' ? '大狙' : lang === 'ru' ? 'АВП' : 'AWP',
    'scar20': lang === 'zh' ? 'SCAR' : lang === 'ru' ? 'СКАР' : 'SCAR20',
    'g3sg1': 'G3',
    'nova': lang === 'zh' ? '警喷' : lang === 'ru' ? 'Нова' : 'Nova',
    'xm1014': lang === 'zh' ? '新星' : lang === 'ru' ? 'ХМ1014' : 'XM1014',
    'mag7': lang === 'zh' ? '连喷' : lang === 'ru' ? 'МАГ7' : 'MAG7',
    'sawedoff': lang === 'zh' ? '匪喷' : lang === 'ru' ? 'Обрез' : 'Sawedoff',
    'm249': 'M249',
    'negev': lang === 'zh' ? '内格夫' : lang === 'ru' ? 'Негев' : 'Negev'
  };
  
  return weaponNames[weaponKey] || weaponKey;
}

// 获取武器基准速度（基于项目设置）
function getWeaponBaseSpeed() {
  if (!currentProject || !currentProject.weapon || currentProject.weapon === 'default') return 240;
  const weapon = currentProject.weapon.replace('_scoped', '');
  if (currentProject.weapon.includes('_scoped')) {
    return WEAPON_SCOPED_SPEEDS[weapon] || WEAPON_SPEEDS[weapon] || 240;
  }
  return WEAPON_SPEEDS[weapon] || 240;
}

function parseInput(text) {
  let finish = /Finished\s+in:?\s*([0-9:.]+)/i.exec(text);
  let kpm = /Kills\s+per\s+Minute:?\s*([0-9.]+)/i.exec(text);
  let kps = /Kills\s+per\s+Second:?\s*([0-9.]+)/i.exec(text);
  let shayer = /Shots\s+per\s+Kill:?\s*([0-9.]+)/i.exec(text);
  
  // 新增：识别Move Speed Shot的Avg/Median/Std数据
  let moveSpeedShotMatch = /Move\s+Speed\s+Shot\s*\([^)]*\):?\s*([0-9.]+)\/([0-9.]+)\/([0-9.]+)/i.exec(text);
  let moveSpeedKillMatch = /Move\s+Speed\s+Kill\s*\([^)]*\):?\s*([0-9.]+)\/([0-9.]+)\/([0-9.]+)/i.exec(text);
  
  if (!finish || !kpm || !kps || !shayer) return null;
  
  let shotsPerKill = parseFloat(shayer[1]);
  
  // 计算急停成功率
  let stopSuccessRate = '';
  let stopKillRate = '';
  
  if (moveSpeedShotMatch) {
    let shotAvg = parseFloat(moveSpeedShotMatch[1]);
    let shotMedian = parseFloat(moveSpeedShotMatch[2]);
    let shotStd = parseFloat(moveSpeedShotMatch[3]);
    
    // 计算急停成功率：当数据小于30时算急停成功
    // 这里需要根据武器类型计算基准速度，然后判断急停成功率
    // 暂时使用一个简化的计算方法
    let shotStopRate = calculateStopRate(shotAvg, shotMedian, shotStd, getWeaponBaseSpeed());
    stopSuccessRate = shotStopRate.toFixed(2);
  }
  
  if (moveSpeedKillMatch) {
    let killAvg = parseFloat(moveSpeedKillMatch[1]);
    let killMedian = parseFloat(moveSpeedKillMatch[2]);
    let killStd = parseFloat(moveSpeedKillMatch[3]);
    
    let killStopRate = calculateStopRate(killAvg, killMedian, killStd, getWeaponBaseSpeed());
    stopKillRate = killStopRate.toFixed(2);
  }
  
  return {
    trainTime: new Date().toISOString(),
    finishTime: finish[1],
    killsPerMin: kpm[1],
    killsPerSec: kps[1],
    shotsPerKill: (shotsPerKill ? (1 / shotsPerKill).toFixed(3) : ''),
    stopSuccessRate: stopSuccessRate,
    stopKillRate: stopKillRate
  };
}

// 修改：计算急停成功率的函数
function calculateStopRate(avg, median, std, baseSpeed) {
  // 当移动速度低于基准速度的某个百分比时算急停成功
  // 使用更精确的阈值：当速度低于基准速度的87.5%时算急停成功
  const stopThreshold = baseSpeed * 0.875;
  
  // 获取项目设置的击杀数量，影响正态分布计算的置信度
  const killCount = currentProject.killCount || 100;
  
  // 使用正态分布计算成功率
  const zScore = (stopThreshold - avg) / std;
  
  let stopRate = 0;
  if (std > 0) {
    // 使用误差函数近似计算正态分布累积概率
    // 根据击杀数量调整置信度（击杀数越多，置信度越高）
    const confidenceFactor = Math.min(killCount / 100, 2); // 最大2倍置信度
    stopRate = 0.5 * (1 + erf(zScore / Math.sqrt(2) * confidenceFactor));
  } else {
    // 如果标准差为0，直接比较平均值
    stopRate = avg < stopThreshold ? 1 : 0;
  }
  
  return stopRate * 100; // 转换为百分比
}

// 新增：误差函数近似计算
function erf(x) {
  // 使用多项式近似计算误差函数
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}
function getTrainTime() {
  const type = document.getElementById('trainTimeType').value;
  if (type === 'custom') {
    let val = document.getElementById('customTrainTime').value;
    if (val) return new Date(val).toISOString();
  }
  return new Date().toISOString();
}
document.getElementById('trainTimeType').onchange = function() {
  document.getElementById('customTrainTime').style.display = this.value === 'custom' ? '' : 'none';
};
// 全局变量
let tables = loadTables();
let currentTable = Object.keys(tables)[0] || '';
let chartObjs = [];
let lastTable = currentTable;
// 语言包
const LANGS = {
  zh: {
    title: 'Aimbotz训练数据记录与分析（本地版）',
    trainProject: '训练项目',
    trainTime: '训练时间',
    weaponType: '武器类型',
    scopeStatus: '开镜状态',
    now: '当前时间',
    custom: '指定时间',
    recognize: '识别数据',
    manualAdd: '手动添加数据',
    viewData: '查看数据：',
    exportCurrent: '导出当前表格',
    exportAll: '导出所有表格',
    import: '导入数据',
    deleteAll: '删除全部数据',
    deleteTable: '删除项目',
    addTable: '➕ 新建项目',
    feedback: '意见反馈',
    feedbackMsg: '如有建议或问题，请联系开发者：shayer1688@163.com',
    confirmDeleteTable: '确定要删除当前训练项目及其所有数据吗？',
    confirmDeleteAll: '确定要删除当前表格的所有数据吗？',
    confirmDeleteRow: '确定要删除该条数据吗？',
    pleaseSelectTable: '请先选择训练项目',
    notRecognized: '未识别到有效数据！',
    inputTableName: '请输入新训练项目名称：',
    manualAddTitle: '手动添加数据',
    manualSave: '保存',
    manualCancel: '取消',
    editTitle: '修改数据',
    editSave: '保存',
    editCancel: '取消',
    bestShort: '历史最短',
    bestHigh: '历史最高',
    congrats: '恭喜！新纪录！',
    great: '干的漂亮！继续加油！',
    tryHard: '孩子，还需努力！',
    labels: ['训练时间','完成时间','每分钟击杀','每秒击杀','准确率','急停成功率','急停击杀率'],
    chartTitles: ['完成时间','每分钟击杀','每秒击杀','准确率','急停成功率','急停击杀率'],
    avgLine: '平均线',
    trendLine: '趋势线',
    edit: '修改',
    del: '删除',
    saveTip: '已保存',
    restoreSuccess: '恢复成功！',
    restoreFail: '恢复失败，文件格式不正确！',
    resetFilter: '重置筛选',
    filterSort: '筛选/排序',
    filterSortTitle: '筛选与排序',
    sortBy: '排序字段',
    asc: '升序',
    desc: '降序',
    apply: '应用',
    cancel: '取消',
    undo: '撤销',
    export: '导出',
    import: '导入',
    exportExcel: '导出Excel',
    exportJson: '导出JSON备份',
    importExcel: '导入Excel',
    importJson: '导入JSON备份',
    totalTrain: '训练次数',
    lastTrain: '最近训练',
    importSuccess: '导入成功！',
    projectExists: '项目名称已存在！',
    enterProjectName: '请输入项目名称！',
    backup: '备份数据',
    restore: '恢复数据',
    projectSettings: '项目设置',
    projectName: '项目名称',
    weaponType: '武器类型',
    scopeStatus: '开镜状态',
    killCount: '击杀数量',
    saveSettings: '保存设置',
    cancel: '取消',
    pleaseEnterProjectName: '请输入项目名称！',
    pleaseSelectWeapon: '请选择武器类型！',
    selectWeapon: '请选择武器',
    normalStatus: '普通状态',
    scopedStatus: '开镜状态',
    selectProject: '请选择项目',
    editProject: '修改项目',
    inputMethod: '填写方式',
    directInput: '直接填写急停成功率/击杀率',
    calculateInput: '填写移动速度数据自动计算',
    moveSpeedData: '移动速度数据',
    calculationResults: '计算结果',
  },
  en: {
    title: 'Aimbotz Training Data Tracker (Local)',
    trainProject: 'Project',
    trainTime: 'Train Time',
    weaponType: 'Weapon Type',
    scopeStatus: 'Scope Status',
    now: 'Now',
    custom: 'Custom',
    recognize: 'Recognize',
    manualAdd: 'Manual Add',
    viewData: 'View:',
    exportCurrent: 'Export Current',
    exportAll: 'Export All',
    import: 'Import',
    deleteAll: 'Delete All',
    deleteTable: 'Delete Project',
    addTable: '➕ New Project',
    feedback: 'Feedback',
    feedbackMsg: 'For suggestions or issues, contact: shayer1688@163.com',
    confirmDeleteTable: 'Delete this project and all its data?',
    confirmDeleteAll: 'Delete all data in this table?',
    confirmDeleteRow: 'Delete this record?',
    pleaseSelectTable: 'Please select a project first',
    notRecognized: 'No valid data recognized!',
    inputTableName: 'Enter new project name:',
    manualAddTitle: 'Manual Add',
    manualSave: 'Save',
    manualCancel: 'Cancel',
    editTitle: 'Edit Data',
    editSave: 'Save',
    editCancel: 'Cancel',
    bestShort: 'Best (Shortest)',
    bestHigh: 'Best (Highest)',
    congrats: 'Congrats! New Record!',
    great: 'Great! Keep it up!',
    tryHard: 'Try harder!',
    labels: ['Train Time','Finish Time','Kills/Min','Kills/Sec','Accuracy','Stop Success Rate','Stop Kill Rate'],
    chartTitles: ['Finish Time','Kills/Min','Kills/Sec','Accuracy','Stop Success Rate','Stop Kill Rate'],
    avgLine: 'Avg',
    trendLine: 'Trend',
    edit: 'Edit',
    del: 'Delete',
    saveTip: 'Saved',
    restoreSuccess: 'Restore success!',
    restoreFail: 'Restore failed, invalid file!',
    resetFilter: 'Reset',
    filterSort: 'Filter/Sort',
    filterSortTitle: 'Filter & Sort',
    sortBy: 'Sort by',
    asc: 'Asc',
    desc: 'Desc',
    apply: 'Apply',
    cancel: 'Cancel',
    undo: 'Undo',
    export: 'Export',
    import: 'Import',
    exportExcel: 'Export Excel',
    exportJson: 'Export JSON Backup',
    importExcel: 'Import Excel',
    importJson: 'Import JSON Backup',
    totalTrain: 'Total',
    lastTrain: 'Last Train',
    importSuccess: 'Import successful!',
    projectExists: 'Project name already exists!',
    enterProjectName: 'Please enter project name!',
    backup: 'Backup Data',
    restore: 'Restore Data',
    projectSettings: 'Project Settings',
    projectName: 'Project Name',
    weaponType: 'Weapon Type',
    scopeStatus: 'Scope Status',
    killCount: 'Kill Count',
    saveSettings: 'Save Settings',
    cancel: 'Cancel',
    pleaseEnterProjectName: 'Please enter project name!',
    pleaseSelectWeapon: 'Please select weapon type!',
    selectWeapon: 'Please select weapon',
    normalStatus: 'Normal Status',
    scopedStatus: 'Scoped Status',
    selectProject: 'Please select project',
    editProject: 'Edit Project',
    inputMethod: 'Input Method',
    directInput: 'Direct input stop success/kill rate',
    calculateInput: 'Input move speed data for calculation',
    moveSpeedData: 'Move Speed Data',
    calculationResults: 'Calculation Results',
  },
  ru: {
    title: 'Aimbotz Трекер Тренировочных Данных (Локальный)',
    trainProject: 'Проект',
    trainTime: 'Время Тренировки',
    weaponType: 'Тип Оружия',
    scopeStatus: 'Статус Прицела',
    now: 'Сейчас',
    custom: 'Пользовательское',
    recognize: 'Распознать',
    manualAdd: 'Ручное Добавление',
    viewData: 'Просмотр:',
    exportCurrent: 'Экспорт Текущего',
    exportAll: 'Экспорт Всего',
    import: 'Импорт',
    deleteAll: 'Удалить Все',
    deleteTable: 'Удалить Проект',
    addTable: '➕ Новый Проект',
    feedback: 'Обратная Связь',
    feedbackMsg: 'Для предложений или проблем, свяжитесь: shayer1688@163.com',
    confirmDeleteTable: 'Удалить этот проект и все его данные?',
    confirmDeleteAll: 'Удалить все данные в этой таблице?',
    confirmDeleteRow: 'Удалить эту запись?',
    pleaseSelectTable: 'Пожалуйста, сначала выберите проект',
    notRecognized: 'Действительные данные не распознаны!',
    inputTableName: 'Введите название нового проекта:',
    manualAddTitle: 'Ручное Добавление',
    manualSave: 'Сохранить',
    manualCancel: 'Отмена',
    editTitle: 'Редактировать Данные',
    editSave: 'Сохранить',
    editCancel: 'Отмена',
    bestShort: 'Лучший (Кратчайший)',
    bestHigh: 'Лучший (Высший)',
    congrats: 'Поздравляем! Новый Рекорд!',
    great: 'Отлично! Продолжайте в том же духе!',
    tryHard: 'Старайтесь больше!',
    labels: ['Время Тренировки','Время Завершения','Убийств/Мин','Убийств/Сек','Точность','Процент Успешной Остановки','Процент Убийств при Остановке'],
    chartTitles: ['Время Завершения','Убийств/Мин','Убийств/Сек','Точность','Процент Успешной Остановки','Процент Убийств при Остановке'],
    avgLine: 'Среднее',
    trendLine: 'Тренд',
    edit: 'Редактировать',
    del: 'Удалить',
    saveTip: 'Сохранено',
    restoreSuccess: 'Восстановление успешно!',
    restoreFail: 'Восстановление не удалось, неверный файл!',
    resetFilter: 'Сброс',
    filterSort: 'Фильтр/Сортировка',
    filterSortTitle: 'Фильтр и Сортировка',
    sortBy: 'Сортировать по',
    asc: 'Возр',
    desc: 'Убыв',
    apply: 'Применить',
    cancel: 'Отмена',
    undo: 'Отменить',
    export: 'Экспорт',
    import: 'Импорт',
    exportExcel: 'Экспорт Excel',
    exportJson: 'Экспорт JSON Резервной Копии',
    importExcel: 'Импорт Excel',
    importJson: 'Импорт JSON Резервной Копии',
    totalTrain: 'Всего',
    lastTrain: 'Последняя Тренировка',
    importSuccess: 'Импорт успешен!',
    projectExists: 'Название проекта уже существует!',
    enterProjectName: 'Пожалуйста, введите название проекта!',
    backup: 'Резервная Копия Данных',
    restore: 'Восстановить Данные',
    projectSettings: 'Настройки Проекта',
    projectName: 'Название Проекта',
    weaponType: 'Тип Оружия',
    scopeStatus: 'Статус Прицела',
    killCount: 'Количество Убийств',
    saveSettings: 'Сохранить Настройки',
    cancel: 'Отмена',
    pleaseEnterProjectName: 'Пожалуйста, введите название проекта!',
    pleaseSelectWeapon: 'Пожалуйста, выберите тип оружия!',
    selectWeapon: 'Пожалуйста, выберите оружие',
    normalStatus: 'Обычное Состояние',
    scopedStatus: 'Состояние Прицела',
    selectProject: 'Пожалуйста, выберите проект',
    editProject: 'Редактировать Проект',
    inputMethod: 'Способ Ввода',
    directInput: 'Прямой ввод процента успешной остановки/убийства',
    calculateInput: 'Ввод данных скорости движения для расчета',
    moveSpeedData: 'Данные Скорости Движения',
    calculationResults: 'Результаты Расчетов',
  }
};
let lang = localStorage.getItem('aimbotz_lang') || 'zh';
function setLang(l) {
  lang = l;
  localStorage.setItem('aimbotz_lang', l);
  renderLang();
  renderTable();
  renderStatsPanel(); // 新增，切换语言时刷新统计栏
  updateProjectInfoDisplay(); // 切换语言时更新项目信息显示
  updateProjectWeaponSpeedDisplay(); // 切换语言时更新项目武器速度显示
  
  // 如果项目设置对话框是打开的，重新生成武器选项
  const projectSettingsModal = document.getElementById('projectSettingsModal');
  if (projectSettingsModal && projectSettingsModal.style.display !== 'none') {
    const weaponSelect = document.getElementById('projectWeaponSelect');
    if (weaponSelect) {
      generateWeaponOptions(weaponSelect);
      // 恢复之前选择的武器
      if (currentProject.weapon) {
        weaponSelect.value = currentProject.weapon;
      }
    }
  }
}
document.getElementById('langSelect').value = lang;
document.getElementById('langSelect').onchange = function() { setLang(this.value); };
function renderLang() {
  const L = LANGS[lang];
  document.title = L.title;
  document.querySelector('label[for="viewSelect"]').textContent = L.viewData;
  document.getElementById('exportCurrentBtn').textContent = L.exportCurrent;
  document.getElementById('exportAllBtn').textContent = L.exportAll;
  document.getElementById('importBtn').textContent = L.import;
  document.getElementById('deleteAllBtn').textContent = L.deleteAll;
  document.getElementById('deleteTableBtn').textContent = L.deleteTable;
  document.getElementById('parseBtn').textContent = L.recognize;
  document.getElementById('manualAddBtn').textContent = L.manualAdd;
  document.getElementById('feedbackBtn').textContent = L.feedback;
  document.getElementById('exportMenuBtn').textContent = L.export;
  document.getElementById('importMenuBtn').textContent = L.import;
  document.getElementById('backupBtn').textContent = L.backup;
  document.getElementById('restoreBtn').textContent = L.restore;
  // 下拉菜单标题
  document.querySelectorAll('.input-row label')[0].textContent = L.trainProject;
  document.querySelectorAll('.input-row label')[1].textContent = L.trainTime;
  // 查看数据标签
  document.querySelector('label[for="viewSelect"]').textContent = L.viewData;
  // 时间下拉
  let timeSel = document.getElementById('trainTimeType');
  timeSel.options[0].text = L.now;
  timeSel.options[1].text = L.custom;
  // 数据输入框占位符
  let placeholderText = '请输入训练结果文本，回车录入...';
  if (lang === 'en') placeholderText = 'Enter training result text, press Enter to submit...';
  else if (lang === 'ru') placeholderText = 'Введите текст результатов тренировки, нажмите Enter для отправки...';
  document.getElementById('dataInput').placeholder = placeholderText;
  // 页面标题
  document.querySelector('h1').textContent = L.title;
  // 悬浮按钮标题
  let gotoTableTitle = '跳转到表格';
  let gotoChartsTitle = '跳转到折线图';
  let tutorialTitle = '使用教程';
  let darkModeTitle = '夜间模式';
  let newProjectTitle = '新建项目';
  
  if (lang === 'en') {
    gotoTableTitle = 'Go to Table';
    gotoChartsTitle = 'Go to Charts';
    tutorialTitle = 'Tutorial';
    darkModeTitle = 'Dark Mode';
    newProjectTitle = 'New Project';
  } else if (lang === 'ru') {
    gotoTableTitle = 'Перейти к Таблице';
    gotoChartsTitle = 'Перейти к Графикам';
    tutorialTitle = 'Учебник';
    darkModeTitle = 'Темный Режим';
    newProjectTitle = 'Новый Проект';
  }
  
  const gotoTableBtn = document.getElementById('gotoTableBtn');
  const gotoChartsBtn = document.getElementById('gotoChartsBtn');
  const tutorialBtn = document.getElementById('tutorialBtn');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const addTableBtn = document.getElementById('addTableBtn');
  
  if (gotoTableBtn) gotoTableBtn.title = gotoTableTitle;
  if (gotoChartsBtn) gotoChartsBtn.title = gotoChartsTitle;
  if (tutorialBtn) tutorialBtn.title = tutorialTitle;
  if (themeToggleBtn) themeToggleBtn.textContent = darkModeTitle;
  if (addTableBtn) addTableBtn.title = newProjectTitle;
  
  // 项目设置对话框多语言
  const projectSettingsTitle = document.getElementById('projectSettingsTitle');
  const projectSelectLabel = document.getElementById('projectSelectLabel');
  const projectNameLabel = document.getElementById('projectNameLabel');
  const projectWeaponLabel = document.getElementById('projectWeaponLabel');
  const projectKillCountLabel = document.getElementById('projectKillCountLabel');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const cancelProjectBtn = document.getElementById('cancelProjectBtn');
  const editProjectBtn = document.getElementById('editProjectBtn');
  
  if (projectSettingsTitle) projectSettingsTitle.textContent = L.projectSettings;
  if (projectSelectLabel) {
    let selectProjectText = '选择项目';
    if (lang === 'en') selectProjectText = 'Select Project';
    else if (lang === 'ru') selectProjectText = 'Выберите Проект';
    projectSelectLabel.textContent = selectProjectText;
  }
  if (projectNameLabel) projectNameLabel.textContent = L.projectName;
  if (projectWeaponLabel) projectWeaponLabel.textContent = L.weaponType;
  if (projectKillCountLabel) {
    let killCountText = L.killCount;
    if (lang === 'zh') killCountText += ' (影响正态分布计算)';
    else if (lang === 'en') killCountText += ' (affects normal distribution calculation)';
    else if (lang === 'ru') killCountText += ' (влияет на расчет нормального распределения)';
    projectKillCountLabel.textContent = killCountText;
  }
  if (saveProjectBtn) saveProjectBtn.textContent = L.saveSettings;
  if (cancelProjectBtn) cancelProjectBtn.textContent = L.cancel;
  if (editProjectBtn) editProjectBtn.textContent = L.editProject;
  
  // 项目设置对话框选项文本
  const projectWeaponPlaceholder = document.getElementById('projectWeaponPlaceholder');
  
  if (projectWeaponPlaceholder) projectWeaponPlaceholder.textContent = L.selectWeapon;
  
  // 击杀数量下拉菜单多语言
  const customKillCountOption = document.getElementById('customKillCountOption');
  const projectKillCountInput = document.getElementById('projectKillCountInput');
  
  if (customKillCountOption) {
    let customText = '自定义...';
    if (lang === 'en') customText = 'Custom...';
    else if (lang === 'ru') customText = 'Пользовательский...';
    customKillCountOption.textContent = customText;
  }
  
  if (projectKillCountInput) {
    let placeholderText = '请输入自定义击杀数量';
    if (lang === 'en') placeholderText = 'Enter custom kill count';
    else if (lang === 'ru') placeholderText = 'Введите пользовательское количество убийств';
    projectKillCountInput.placeholder = placeholderText;
  }
  
  // 项目名称输入框占位符
  const projectNameInput = document.getElementById('projectNameInput');
  if (projectNameInput) {
    let placeholderText = '请输入项目名称';
    if (lang === 'en') placeholderText = 'Please enter project name';
    else if (lang === 'ru') placeholderText = 'Пожалуйста, введите название проекта';
    projectNameInput.placeholder = placeholderText;
  }
  
  // 武器分组标签翻译
  const pistolGroup = document.getElementById('pistolGroup');
  const smgGroup = document.getElementById('smgGroup');
  const rifleGroup = document.getElementById('rifleGroup');
  const sniperGroup = document.getElementById('sniperGroup');
  const shotgunGroup = document.getElementById('shotgunGroup');
  const lmgGroup = document.getElementById('lmgGroup');
  
  if (pistolGroup) {
    let pistolLabel = '手枪';
    if (lang === 'en') pistolLabel = 'Pistols';
    else if (lang === 'ru') pistolLabel = 'Пистолеты';
    pistolGroup.label = pistolLabel;
  }
  
  if (smgGroup) {
    let smgLabel = '冲锋枪';
    if (lang === 'en') smgLabel = 'SMGs';
    else if (lang === 'ru') smgLabel = 'Пистолеты-Пулеметы';
    smgGroup.label = smgLabel;
  }
  
  if (rifleGroup) {
    let rifleLabel = '步枪';
    if (lang === 'en') rifleLabel = 'Rifles';
    else if (lang === 'ru') rifleLabel = 'Винтовки';
    rifleGroup.label = rifleLabel;
  }
  
  if (sniperGroup) {
    let sniperLabel = '狙击枪';
    if (lang === 'en') sniperLabel = 'Snipers';
    else if (lang === 'ru') sniperLabel = 'Снайперские Винтовки';
    sniperGroup.label = sniperLabel;
  }
  
  if (shotgunGroup) {
    let shotgunLabel = '霰弹枪';
    if (lang === 'en') shotgunLabel = 'Shotguns';
    else if (lang === 'ru') shotgunLabel = 'Дробовики';
    shotgunGroup.label = shotgunLabel;
  }
  
  if (lmgGroup) {
    let lmgLabel = '机枪';
    if (lang === 'en') lmgLabel = 'LMGs';
    else if (lang === 'ru') lmgLabel = 'Пулеметы';
    lmgGroup.label = lmgLabel;
  }
  
  // 更新武器选项文本
  const weaponSelect = document.getElementById('projectWeaponSelect');
  if (weaponSelect) {
    generateWeaponOptions(weaponSelect);
  }
}
function refreshTableSelects() {
  const tableSelect = document.getElementById('tableSelect');
  const viewSelect = document.getElementById('viewSelect');
  const L = LANGS[lang];
  tableSelect.innerHTML = '';
  viewSelect.innerHTML = '';
  let hasTable = false;
  for (let name of Object.keys(tables)) {
    let opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    tableSelect.appendChild(opt);
    let opt2 = document.createElement('option');
    opt2.value = name;
    opt2.textContent = name;
    viewSelect.appendChild(opt2);
    hasTable = true;
  }
  // 如果没有项目，设置默认值
  if (!hasTable) {
    currentTable = '';
    tableSelect.value = '';
    viewSelect.value = '';
  } else {
    // 如果有项目，确保currentTable有效
    if (!currentTable || !(currentTable in tables)) {
      currentTable = Object.keys(tables)[0] || '';
    }
    tableSelect.value = currentTable;
    viewSelect.value = currentTable;
  }
  document.getElementById('dataSection').style.display = hasTable ? '' : 'none';
}
function showAddTableDialog() {
  // 先移除可能存在的旧弹窗
  let oldModal = document.getElementById('addTableModal');
  if (oldModal) oldModal.remove();
  let L = LANGS[lang];
  
  // 创建模态框容器
  let modal = document.createElement('div');
  modal.id = 'addTableModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
  
  // 创建弹窗内容
  let content = document.createElement('div');
  content.style.cssText = 'background:white;padding:30px;border-radius:10px;min-width:400px;max-width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 4px 20px rgba(0,0,0,0.3);';
  
  // 标题
  let title = document.createElement('h3');
  title.textContent = L.addTable;
  title.style.cssText = 'margin:0 0 20px 0;color:#1565c0;text-align:center;';
  content.appendChild(title);
  
  // 项目名称
  let nameLabel = document.createElement('label');
  nameLabel.textContent = L.projectName;
  nameLabel.style.cssText = 'display:block;margin-bottom:6px;font-size:15px;color:#1565c0;font-weight:600;';
  content.appendChild(nameLabel);
  
  let nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.id = 'newTableName';
  nameInput.placeholder = L.inputTableName;
  nameInput.style.cssText = 'width:100%;padding:10px;border:2px solid #2196f3;border-radius:6px;font-size:16px;margin-bottom:20px;box-sizing:border-box;';
  content.appendChild(nameInput);
  
  // 武器类型
  let weaponLabel = document.createElement('label');
  weaponLabel.textContent = L.weaponType;
  weaponLabel.style.cssText = 'display:block;margin-bottom:6px;font-size:15px;color:#1565c0;font-weight:600;';
  content.appendChild(weaponLabel);
  
  let weaponSelect = document.createElement('select');
  weaponSelect.id = 'newTableWeapon';
  weaponSelect.style.cssText = 'width:100%;padding:10px;border:2px solid #2196f3;border-radius:6px;font-size:16px;margin-bottom:20px;box-sizing:border-box;';
  
  // 使用generateWeaponOptions函数生成武器选项
  generateWeaponOptions(weaponSelect);
  
  content.appendChild(weaponSelect);
  
  // 击杀数量
  let killLabel = document.createElement('label');
  killLabel.textContent = L.killCount;
  killLabel.style.cssText = 'display:block;margin-bottom:6px;font-size:15px;color:#1565c0;font-weight:600;';
  content.appendChild(killLabel);
  
  let killSelect = document.createElement('select');
  killSelect.id = 'newTableKillCountSelect';
  killSelect.style.cssText = 'width:100%;padding:10px;border:2px solid #2196f3;border-radius:6px;font-size:16px;margin-bottom:8px;box-sizing:border-box;';
  
  // 添加预设选项
  let customText = '自定义...';
  if (lang === 'en') customText = 'Custom...';
  else if (lang === 'ru') customText = 'Пользовательский...';
  
  let options = [
    {value: '100', text: '100'},
    {value: '250', text: '250'},
    {value: '500', text: '500'},
    {value: '1000', text: '1000'},
    {value: 'custom', text: customText}
  ];
  
  options.forEach(option => {
    let opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.text;
    killSelect.appendChild(opt);
  });
  
  content.appendChild(killSelect);
  
  let killInput = document.createElement('input');
  killInput.type = 'number';
  killInput.id = 'newTableKillCountInput';
  killInput.value = '100';
  killInput.min = '1';
  killInput.max = '10000';
  let placeholderText = '请输入自定义击杀数量';
  if (lang === 'en') placeholderText = 'Enter custom kill count';
  else if (lang === 'ru') placeholderText = 'Введите пользовательское количество убийств';
  killInput.placeholder = placeholderText;
  killInput.style.cssText = 'width:100%;padding:10px;border:2px solid #2196f3;border-radius:6px;font-size:16px;margin-bottom:20px;box-sizing:border-box;display:none;';
  content.appendChild(killInput);
  
  // 按钮容器
  let btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:15px;justify-content:center;';
  
  // 确定按钮
  let saveBtn = document.createElement('button');
  saveBtn.textContent = L.manualSave;
  saveBtn.style.cssText = 'background:#2196f3;color:white;padding:10px 20px;border:none;border-radius:6px;font-size:16px;cursor:pointer;';
  btnContainer.appendChild(saveBtn);
  
  // 取消按钮
  let cancelBtn = document.createElement('button');
  cancelBtn.textContent = L.manualCancel;
  cancelBtn.style.cssText = 'background:#ccc;color:#333;padding:10px 20px;border:none;border-radius:6px;font-size:16px;cursor:pointer;';
  btnContainer.appendChild(cancelBtn);
  
  content.appendChild(btnContainer);
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // 聚焦到输入框
  nameInput.focus();
  
  // 击杀数量下拉菜单事件处理
  killSelect.onchange = function() {
    if (this.value === 'custom') {
      killInput.style.display = 'block';
      killInput.focus();
    } else {
      killInput.style.display = 'none';
    }
  };
  
  // 事件处理
  cancelBtn.onclick = function() {
    modal.remove();
  };
  
  saveBtn.onclick = function() {
    let name = nameInput.value.trim();
    let weapon = weaponSelect.value;
    
    // 获取击杀数量
    let killCount = 100;
    if (killSelect.value === 'custom') {
      killCount = parseInt(killInput.value) || 100;
    } else {
      killCount = parseInt(killSelect.value) || 100;
    }
    
    if (!name) {
      alert(L.pleaseEnterProjectName);
      return;
    }
    
    if (!weapon) {
      alert(L.pleaseSelectWeapon);
      return;
    }
    
         if (name in tables) {
       alert(LANGS[lang].projectExists);
       return;
     }
     
     // 创建新项目并保存设置
     tables[name] = [];
     currentTable = name;
     
     // 保存项目设置
     currentProject.name = name;
     currentProject.weapon = weapon;
     currentProject.killCount = killCount;
     
     // 保存到本地存储
     localStorage.setItem(PROJECT_SETTINGS_KEY, JSON.stringify(currentProject));
     localStorage.setItem(`project_settings_${name}`, JSON.stringify(currentProject));
     
     saveTables(tables);
     refreshTableSelects();
     renderTable();
     modal.remove();
   };
   
   // 点击模态框外部关闭
   modal.onclick = function(e) {
     if (e.target === modal) {
       modal.remove();
     }
   };
   
   // 键盘事件处理
   nameInput.onkeydown = function(e) {
     if (e.key === 'Enter') {
       saveBtn.click();
     } else if (e.key === 'Escape') {
       cancelBtn.click();
     }
   };
 }
document.getElementById('tableSelect').onfocus = function() {
  lastTable = this.value;
};
document.getElementById('tableSelect').onchange = function() {
  currentTable = this.value;
  
  // 加载对应项目的设置
  if (currentTable) {
    loadProjectSettingsByName(currentTable);
  }
  
  renderTable();
  renderStatsPanel(); // 更新统计栏
  updateProjectInfoDisplay(); // 更新项目信息栏
  document.getElementById('viewSelect').value = currentTable;
};
document.getElementById('viewSelect').onchange = function() {
  currentTable = this.value;
  document.getElementById('tableSelect').value = currentTable;
  
  // 加载对应项目的设置
  if (currentTable) {
    loadProjectSettingsByName(currentTable);
  }
  
  renderTable();
  renderStatsPanel(); // 更新统计栏
  updateProjectInfoDisplay(); // 更新项目信息栏
};
document.getElementById('addTableBtn').onclick = function() {
  showAddTableDialog();
};
function submitDataInput() {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  let text = document.getElementById('dataInput').value.trim();
  let data = parseInput(text);
  if (!data) return alert(LANGS[lang].notRecognized);
  data.trainTime = getTrainTime();
  tables[currentTable].push(JSON.parse(JSON.stringify(data)));
  saveTables(tables);
  renderTable();
  renderStatsPanel(); // 新增
  document.getElementById('dataInput').value = '';
}
document.getElementById('parseBtn').onclick = submitDataInput;
document.getElementById('dataInput').onkeydown = function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitDataInput();
  }
};
document.getElementById('manualAddBtn').onclick = function() {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  let L = LANGS[lang];
  let html = '<div id="manualModal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.6);z-index:2000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">'+
    '<div style="background:#fff;padding:32px 28px;border-radius:16px;min-width:480px;max-width:90vw;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(33,150,243,0.3),0 4px 16px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:20px;border:2px solid #e3f2fd;animation:modalSlideIn 0.3s ease-out;">'+
    '<div style="position:relative;">'+
      '<button id="manualCloseBtn" style="position:absolute;top:-10px;right:-10px;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f44336,#d32f2f);color:#fff;border:none;font-size:18px;cursor:pointer;box-shadow:0 4px 12px rgba(244,67,54,0.3);display:flex;align-items:center;justify-content:center;z-index:10;">×</button>'+
      '<div style="text-align:center;margin-bottom:8px;">'+
        '<h3 style="margin:0;color:#1565c0;font-size:24px;font-weight:700;letter-spacing:1px;">'+L.manualAddTitle+'</h3>'+
        '<div style="width:60px;height:3px;background:linear-gradient(90deg,#2196f3,#1565c0);margin:12px auto 0;border-radius:2px;"></div>'+
      '</div>'+
    '</div>';
  
  // 基础字段（总是显示）
  const basicFields = ['trainTime', 'finishTime', 'killsPerMin', 'killsPerSec', 'shotsPerKill'];
  html += '<div style="background:#f8fbff;padding:20px;border-radius:12px;border:1px solid #e3f2fd;margin-bottom:16px;box-shadow:0 2px 8px rgba(33,150,243,0.05);">'+
    '<div style="font-size:16px;color:#1565c0;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;">'+
      '<span style="width:4px;height:20px;background:linear-gradient(180deg,#2196f3,#1565c0);border-radius:2px;"></span>'+
      '<span style="font-size:18px;margin-right:4px;">📊</span>'+
      (lang === 'zh' ? '基础数据' : lang === 'en' ? 'Basic Data' : 'Основные Данные')+
    '</div>';
  
  for (let col of COLUMNS) {
    if (basicFields.includes(col.key)) {
      html += '<div style="margin-bottom:16px;">'+
        '<label style="display:block;margin-bottom:6px;font-size:14px;color:#1565c0;font-weight:600;">'+col.label+'</label>';
      if (col.key === 'trainTime') {
        html += '<input type="datetime-local" id="manual_'+col.key+'" value="'+formatDateLocal(new Date())+'" style="width:100%;padding:12px 16px;border:2px solid #2196f3;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(33,150,243,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">';
      } else if (col.key === 'finishTime') {
        html += '<input type="text" id="manual_'+col.key+'" value="" placeholder="00:11.703" style="width:100%;padding:12px 16px;border:2px solid #2196f3;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(33,150,243,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">';
      } else if (col.key === 'killsPerMin') {
        html += '<input type="text" id="manual_'+col.key+'" value="" placeholder="51.27" style="width:100%;padding:12px 16px;border:2px solid #2196f3;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(33,150,243,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">';
      } else if (col.key === 'killsPerSec') {
        html += '<input type="text" id="manual_'+col.key+'" value="" placeholder="0.85" style="width:100%;padding:12px 16px;border:2px solid #2196f3;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(33,150,243,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">';
      } else if (col.key === 'shotsPerKill') {
        html += '<input type="text" id="manual_'+col.key+'" value="" placeholder="1.8" style="width:100%;padding:12px 16px;border:2px solid #2196f3;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(33,150,243,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">';
      } else {
        html += '<input type="text" id="manual_'+col.key+'" value="" style="width:100%;padding:12px 16px;border:2px solid #2196f3;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(33,150,243,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">';
      }
      html += '</div>';
    }
  }
  html += '</div>';
  
  // 直接填写模式
  html += '<div id="manualDirectMode" style="display:block;background:#f8fbff;padding:20px;border-radius:12px;border:1px solid #e3f2fd;margin-bottom:16px;box-shadow:0 2px 8px rgba(76,175,80,0.05);">'+
    '<div style="font-size:16px;color:#1565c0;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;">'+
      '<span style="width:4px;height:20px;background:linear-gradient(180deg,#4caf50,#2e7d32);border-radius:2px;"></span>'+
      '<span style="font-size:18px;margin-right:4px;">🎯</span>'+
      (lang === 'zh' ? '急停数据' : lang === 'en' ? 'Stop Data' : 'Данные Остановки')+
    '</div>'+
    '<div style="margin-bottom:20px;padding:16px;background:rgba(76,175,80,0.05);border-radius:8px;border:1px solid rgba(76,175,80,0.2);">'+
      '<label style="display:block;margin-bottom:8px;font-size:15px;color:#1565c0;font-weight:600;">'+L.inputMethod+'</label>'+
      '<select id="manualInputMethod" style="width:100%;padding:12px 16px;border:2px solid #4caf50;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(76,175,80,0.1);transition:all 0.2s;outline:none;">'+
        '<option value="direct">'+L.directInput+'</option>'+
        '<option value="calculate">'+L.calculateInput+'</option>'+
      '</select>'+
    '</div>';
  for (let col of COLUMNS) {
    if (col.key === 'stopSuccessRate' || col.key === 'stopKillRate') {
      html += '<div style="margin-bottom:16px;">'+
        '<label style="display:block;margin-bottom:6px;font-size:14px;color:#1565c0;font-weight:600;">'+col.label+'</label>'+
        '<input type="text" id="manual_'+col.key+'" value="" style="width:100%;padding:12px 16px;border:2px solid #4caf50;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(76,175,80,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;" placeholder="0.00">'+
      '</div>';
    }
  }
  html += '</div>';
  
  // 计算模式
  html += '<div id="manualCalculateMode" style="display:none;background:#f8fbff;padding:20px;border-radius:12px;border:1px solid #e3f2fd;margin-bottom:16px;box-shadow:0 2px 8px rgba(255,152,0,0.05);">'+
    '<div style="font-size:16px;color:#1565c0;font-weight:600;margin-bottom:16px;display:flex;align-items:center;gap:8px;">'+
      '<span style="width:4px;height:20px;background:linear-gradient(180deg,#ff9800,#f57c00);border-radius:2px;"></span>'+
      '<span style="font-size:18px;margin-right:4px;">⚡</span>'+
      L.moveSpeedData+
    '</div>'+
    '<div style="margin-bottom:20px;padding:16px;background:rgba(255,152,0,0.05);border-radius:8px;border:1px solid rgba(255,152,0,0.2);">'+
      '<label style="display:block;margin-bottom:8px;font-size:15px;color:#1565c0;font-weight:600;">'+L.inputMethod+'</label>'+
      '<select id="manualInputMethod2" style="width:100%;padding:12px 16px;border:2px solid #ff9800;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(255,152,0,0.1);transition:all 0.2s;outline:none;">'+
        '<option value="direct">'+L.directInput+'</option>'+
        '<option value="calculate" selected>'+L.calculateInput+'</option>'+
      '</select>'+
    '</div>'+
    '<div style="margin-bottom:16px;">'+
      '<label style="display:block;margin-bottom:6px;font-size:14px;color:#1565c0;font-weight:600;">' + (lang === 'zh' ? 'Move Speed Shot (平均值/中位数/标准差)' : lang === 'en' ? 'Move Speed Shot (Avg/Median/Std)' : 'Скорость Движения Выстрела (Среднее/Медиана/Стд)') + '</label>'+
      '<input type="text" id="manual_moveSpeedShot" placeholder="215.38/230/54.1" style="width:100%;padding:12px 16px;border:2px solid #ff9800;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(255,152,0,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">'+
    '</div>'+
    '<div style="margin-bottom:16px;">'+
      '<label style="display:block;margin-bottom:6px;font-size:14px;color:#1565c0;font-weight:600;">' + (lang === 'zh' ? 'Move Speed Kill (平均值/中位数/标准差)' : lang === 'en' ? 'Move Speed Kill (Avg/Median/Std)' : 'Скорость Движения Убийства (Среднее/Медиана/Стд)') + '</label>'+
      '<input type="text" id="manual_moveSpeedKill" placeholder="210.06/230/66" style="width:100%;padding:12px 16px;border:2px solid #ff9800;border-radius:8px;font-size:15px;background:#fff;color:#1565c0;box-shadow:0 2px 8px rgba(255,152,0,0.1);transition:all 0.2s;outline:none;box-sizing:border-box;">'+
    '</div>'+
    '<div id="manualCalculatedResults" style="margin-top:16px;padding:16px;background:linear-gradient(135deg,#e3f2fd,#f3e5f5);border-radius:10px;border:2px solid #2196f3;display:none;box-shadow:0 4px 12px rgba(33,150,243,0.15);">'+
      '<div style="font-size:16px;color:#1565c0;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;">'+
        '<span style="width:6px;height:6px;background:#2196f3;border-radius:50%;"></span>'+
        L.calculationResults+
      '</div>'+
      '<div id="manualStopSuccessResult" style="font-size:15px;color:#1565c0;font-weight:600;margin-bottom:8px;padding:8px 12px;background:rgba(255,255,255,0.7);border-radius:6px;"></div>'+
      '<div id="manualStopKillResult" style="font-size:15px;color:#1565c0;font-weight:600;padding:8px 12px;background:rgba(255,255,255,0.7);border-radius:6px;"></div>'+
    '</div>'+
  '</div>';
  
  html += '<div style="display:flex;gap:16px;justify-content:center;margin-top:20px;padding-top:20px;border-top:2px solid #e3f2fd;">'+
    '<button id="manualSaveBtn" style="background:linear-gradient(135deg,#2196f3,#1565c0);color:#fff;padding:12px 32px;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(33,150,243,0.3);transition:all 0.2s;min-width:120px;">'+L.manualSave+'</button>'+
    '<button id="manualCancelBtn" style="background:linear-gradient(135deg,#f5f5f5,#e0e0e0);color:#666;padding:12px 32px;border:none;border-radius:10px;font-size:16px;font-weight:600;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,0.1);transition:all 0.2s;min-width:120px;">'+L.manualCancel+'</button>'+
    '</div></div></div>';
  
  document.body.insertAdjacentHTML('beforeend', html);
  
  // 关闭按钮事件
  document.getElementById('manualCloseBtn').onclick = function() {
    document.getElementById('manualModal').remove();
  };
  
  // 填写方式切换事件
  function switchInputMode(value) {
    const directMode = document.getElementById('manualDirectMode');
    const calculateMode = document.getElementById('manualCalculateMode');
    const calculatedResults = document.getElementById('manualCalculatedResults');
    
    if (value === 'direct') {
      directMode.style.display = 'block';
      calculateMode.style.display = 'none';
      calculatedResults.style.display = 'none';
    } else {
      directMode.style.display = 'none';
      calculateMode.style.display = 'block';
    }
  }
  
  document.getElementById('manualInputMethod').onchange = function() {
    switchInputMode(this.value);
    // 同步另一个下拉菜单
    const manualInputMethod2 = document.getElementById('manualInputMethod2');
    if (manualInputMethod2) {
      manualInputMethod2.value = this.value;
    }
  };
  
  document.getElementById('manualInputMethod2').onchange = function() {
    switchInputMode(this.value);
    // 同步另一个下拉菜单
    const manualInputMethod = document.getElementById('manualInputMethod');
    if (manualInputMethod) {
      manualInputMethod.value = this.value;
    }
  };
  
  // 移动速度数据输入事件
  document.getElementById('manual_moveSpeedShot').oninput = calculateManualStopRates;
  document.getElementById('manual_moveSpeedKill').oninput = calculateManualStopRates;
  
  document.getElementById('manualCancelBtn').onclick = function() {
    document.getElementById('manualModal').remove();
  };
  
  document.getElementById('manualSaveBtn').onclick = function() {
    // 获取当前显示的填写方式
    const directMode = document.getElementById('manualDirectMode');
    const inputMethod = directMode.style.display !== 'none' ? 
      document.getElementById('manualInputMethod').value : 
      document.getElementById('manualInputMethod2').value;
    let d = {};
    
    // 基础字段
    for (let col of COLUMNS) {
      if (basicFields.includes(col.key)) {
        let v = document.getElementById('manual_'+col.key).value;
        if (col.key === 'trainTime') {
          d[col.key] = v ? new Date(v).toISOString() : new Date().toISOString();
        } else {
          d[col.key] = v;
        }
      }
    }
    
    // 急停成功率/击杀率
    if (inputMethod === 'direct') {
      // 直接填写模式
      d.stopSuccessRate = document.getElementById('manual_stopSuccessRate').value;
      d.stopKillRate = document.getElementById('manual_stopKillRate').value;
    } else {
      // 计算模式
      const shotInput = document.getElementById('manual_moveSpeedShot').value;
      const killInput = document.getElementById('manual_moveSpeedKill').value;
      
      if (!shotInput || !killInput) {
        let errorMsg = L.moveSpeedData + ' 请填写完整！';
        if (lang === 'en') errorMsg = L.moveSpeedData + ' Please fill in complete!';
        else if (lang === 'ru') errorMsg = L.moveSpeedData + ' Пожалуйста, заполните полностью!';
        alert(errorMsg);
        return;
      }
      
      // 解析移动速度数据
      const shotMatch = /([0-9.]+)\/([0-9.]+)\/([0-9.]+)/.exec(shotInput);
      const killMatch = /([0-9.]+)\/([0-9.]+)\/([0-9.]+)/.exec(killInput);
      
      if (!shotMatch || !killMatch) {
        let errorMsg = L.moveSpeedData + ' 格式错误！请使用"平均值/中位数/标准差"格式';
        if (lang === 'en') errorMsg = L.moveSpeedData + ' format error! Please use "avg/median/std" format';
        else if (lang === 'ru') errorMsg = L.moveSpeedData + ' ошибка формата! Пожалуйста, используйте формат "среднее/медиана/стандартное отклонение"';
        alert(errorMsg);
        return;
      }
      
      const shotAvg = parseFloat(shotMatch[1]);
      const shotMedian = parseFloat(shotMatch[2]);
      const shotStd = parseFloat(shotMatch[3]);
      const killAvg = parseFloat(killMatch[1]);
      const killMedian = parseFloat(killMatch[2]);
      const killStd = parseFloat(killMatch[3]);
      
      // 计算急停成功率
      const shotStopRate = calculateStopRate(shotAvg, shotMedian, shotStd, getWeaponBaseSpeed());
      const killStopRate = calculateStopRate(killAvg, killMedian, killStd, getWeaponBaseSpeed());
      
      d.stopSuccessRate = shotStopRate.toFixed(2);
      d.stopKillRate = killStopRate.toFixed(2);
    }
    
    tables[currentTable].push(JSON.parse(JSON.stringify(d)));
    saveTables(tables);
    renderTable();
    renderStatsPanel();
    document.getElementById('manualModal').remove();
  };
};

// 计算手动添加数据中的急停成功率
function calculateManualStopRates() {
  const shotInput = document.getElementById('manual_moveSpeedShot').value;
  const killInput = document.getElementById('manual_moveSpeedKill').value;
  const resultsDiv = document.getElementById('manualCalculatedResults');
  const successResult = document.getElementById('manualStopSuccessResult');
  const killResult = document.getElementById('manualStopKillResult');
  
  if (!shotInput || !killInput) {
    resultsDiv.style.display = 'none';
    return;
  }
  
  const shotMatch = /([0-9.]+)\/([0-9.]+)\/([0-9.]+)/.exec(shotInput);
  const killMatch = /([0-9.]+)\/([0-9.]+)\/([0-9.]+)/.exec(killInput);
  
  if (!shotMatch || !killMatch) {
    resultsDiv.style.display = 'none';
    return;
  }
  
  // 显示加载状态
  resultsDiv.style.display = 'block';
  let calculatingText = '计算中...';
  if (lang === 'en') calculatingText = 'Calculating...';
  else if (lang === 'ru') calculatingText = 'Вычисление...';
  successResult.innerHTML = '<span style="color:#ff9800;">⏳ ' + calculatingText + '</span>';
  killResult.innerHTML = '<span style="color:#ff9800;">⏳ ' + calculatingText + '</span>';
  
  // 模拟计算延迟，让用户看到加载效果
  setTimeout(() => {
    const shotAvg = parseFloat(shotMatch[1]);
    const shotMedian = parseFloat(shotMatch[2]);
    const shotStd = parseFloat(shotMatch[3]);
    const killAvg = parseFloat(killMatch[1]);
    const killMedian = parseFloat(killMatch[2]);
    const killStd = parseFloat(killMatch[3]);
    
    // 计算急停成功率
    const shotStopRate = calculateStopRate(shotAvg, shotMedian, shotStd, getWeaponBaseSpeed());
    const killStopRate = calculateStopRate(killAvg, killMedian, killStd, getWeaponBaseSpeed());
    
    // 显示结果
    const L = LANGS[lang];
    successResult.innerHTML = '<span style="color:#4caf50;">✅ ' + L.labels[COLUMNS.findIndex(col => col.key === 'stopSuccessRate')] + `: ${shotStopRate.toFixed(2)}%</span>`;
    killResult.innerHTML = '<span style="color:#4caf50;">✅ ' + L.labels[COLUMNS.findIndex(col => col.key === 'stopKillRate')] + `: ${killStopRate.toFixed(2)}%</span>`;
  }, 300);
}
// 渲染表格和图表
function renderTable() {
  refreshTableSelects();
  if (!currentTable || !(currentTable in tables)) return;
  let data = tables[currentTable] || [];
  // 排序与筛选状态
  let sortCol = null, sortDir = 'desc';
  let filter = { timeFrom: '', timeTo: '', min: {}, max: {} };
  // 表头
  const L = LANGS[lang];
  let th = '<tr>';
  for (let i=0;i<COLUMNS.length;i++) {
    let col = COLUMNS[i];
    th += '<th>'+L.labels[i]+'</th>';
  }
  th += '<th>'+L.del+'/'+L.edit+'</th></tr>';
  document.getElementById('tableHeader').innerHTML = th;
  // 标签行
  let labelRow = '<tr>';
  for (let col of COLUMNS) labelRow += '<td style="color:#2196f3;font-weight:600;">'+L.labels[COLUMNS.indexOf(col)]+'</td>';
  labelRow += '<td></td></tr>';
  // 数据行
  // 按训练时间降序排列（最新在最上面）
  let dataWithIndex = data.map((row, origIdx) => ({row, origIdx}));
  dataWithIndex.sort((a, b) => b.row.trainTime.localeCompare(a.row.trainTime));
  let rows = dataWithIndex.map(({row, origIdx}, idx) => {
    let tds = '';
    for (let col of COLUMNS) {
      let v = row[col.key];
      let show = v;
      if (col.key === 'trainTime') show = formatDate(new Date(v));
      tds += '<td data-tooltip="'+L.labels[COLUMNS.indexOf(col)]+'">'+show+'</td>';
    }
    tds += '<td>'+ 
      '<button onclick="editDataSorted('+idx+')" style="color:#2196f3;border:none;background:none;cursor:pointer;margin-right:8px;">'+L.edit+'</button>'+ 
      '<button onclick="deleteDataSorted('+idx+')" style="color:#f44336;border:none;background:none;cursor:pointer;">'+L.del+'</button>'+ 
    '</td>';
    return '<tr>'+tds+'</tr>';
  }).join('');
  document.getElementById('tableBody').innerHTML = labelRow + rows;
  renderCharts(data);
}
// 删除数据（修正：用排序后下标找原始索引）
window.deleteDataSorted = function(idx) {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  if (!confirm(LANGS[lang].confirmDeleteRow)) return;
  let data = tables[currentTable] || [];
  let dataWithIndex = data.map((row, origIdx) => ({row, origIdx}));
  dataWithIndex.sort((a, b) => b.row.trainTime.localeCompare(a.row.trainTime));
  let origIdx = dataWithIndex[idx].origIdx;
  if (!tables[currentTable] || origIdx < 0 || origIdx >= tables[currentTable].length) return;
  tables[currentTable].splice(origIdx, 1);
  saveTables(tables);
  renderTable();
  renderStatsPanel();
};
// 编辑数据（修正：用排序后下标找原始索引）
window.editDataSorted = function(idx) {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  let data = tables[currentTable] || [];
  let dataWithIndex = data.map((row, origIdx) => ({row, origIdx}));
  dataWithIndex.sort((a, b) => b.row.trainTime.localeCompare(a.row.trainTime));
  let origIdx = dataWithIndex[idx].origIdx;
  window.editData(origIdx);
}; 
// 导出当前表格
document.getElementById('exportCurrentBtn').onclick = function() {
  if (!currentTable) return;
  exportTableToExcel(currentTable, tables[currentTable]);
};
// 导出所有表格
document.getElementById('exportAllBtn').onclick = function() {
  for (let name in tables) {
    exportTableToExcel(name, tables[name]);
  }
};
function exportTableToExcel(name, data) {
  let ws = XLSX.utils.json_to_sheet(data.map(row => {
    let obj = {};
    for (let col of COLUMNS) obj[col.label] = col.key === 'trainTime' ? formatDate(new Date(row[col.key])) : row[col.key];
    return obj;
  }));
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name);
  XLSX.writeFile(wb, name + '.xlsx');
} 
// 导入数据
document.getElementById('importBtn').onclick = function() {
  document.getElementById('importFile').value = '';
  document.getElementById('importFile').click();
};
document.getElementById('importFile').onchange = function(e) {
  let file = e.target.files[0];
  if (!file) return;
  let reader = new FileReader();
  reader.onload = function(evt) {
    let data = new Uint8Array(evt.target.result);
    let workbook = XLSX.read(data, {type:'array'});
    for (let sheetName of workbook.SheetNames) {
      let arr = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
      if (!(sheetName in tables)) tables[sheetName] = [];
      for (let row of arr) {
        let obj = {};
        for (let col of COLUMNS) {
          let v = row[col.label];
          if (col.key === 'trainTime') {
            let d = v ? new Date(v) : new Date();
            obj[col.key] = d.toISOString();
          } else {
            obj[col.key] = v;
          }
        }
        tables[sheetName].push(obj);
      }
    }
    saveTables(tables);
    refreshTableSelects();
    renderTable();
    renderStatsPanel();
    
    // 为导入的项目创建默认设置（Excel无法包含项目设置信息）
    restoreProjectSettingsFromImport();
    
    alert(LANGS[lang].importSuccess);
  };
  reader.readAsArrayBuffer(file);
  this.value = '';
}; 
// 渲染图表
function renderCharts(data) {
  if (!window.Chart) return;
  if (!Array.isArray(data)) data = [];
  // 按训练时间升序
  let chartData = data.slice().sort((a,b)=>a.trainTime.localeCompare(b.trainTime));
  let labels = chartData.map(row => formatDate(new Date(row.trainTime)));
  let chartTitles = LANGS[lang].chartTitles;
  let bests = [null,null,null,null,null,null];
  let bestIdx = [null,null,null,null,null,null];
  let avgs = [0,0,0,0,0,0];
  let trend = [0,0,0,0,0,0];
  for (let i=0;i<6;i++) {
    // 过滤掉无效数据
    let vals = chartData.map(row => CHARTS[i].parser(row[CHARTS[i].key])).filter(v => v!==null && !isNaN(v));
    if (!vals.length) continue;
    avgs[i] = vals.reduce((a,b)=>a+b,0)/vals.length;
    // 最好成绩
    if (i===0) { // 完成时间最小
      let min = Math.min(...vals);
      bests[i] = min;
      bestIdx[i] = vals.indexOf(min);
    } else { // 其他最大
      let max = Math.max(...vals);
      bests[i] = max;
      bestIdx[i] = vals.indexOf(max);
    }
    // 趋势线
    if (vals.length>1) {
      let n = vals.length;
      let x = Array.from({length:n},(_,i)=>i+1);
      let avgX = (n+1)/2;
      let avgY = avgs[i];
      let num = 0, den = 0;
      for (let j=0;j<n;j++) {
        num += (x[j]-avgX)*(vals[j]-avgY);
        den += (x[j]-avgX)*(x[j]-avgX);
      }
      trend[i] = den ? num/den : 0;
    }
  }
  // 销毁旧图表
  for (let c of chartObjs) c && c.destroy && c.destroy();
  chartObjs = [];
  for (let i=0;i<6;i++) {
    let ctx = document.getElementById('chart'+(i+1)).getContext('2d');
    // 过滤掉无效数据
    let vals = chartData.map(row => CHARTS[i].parser(row[CHARTS[i].key])).filter(v => v!==null && !isNaN(v));
    let avg = avgs[i];
    let best = bests[i];
    let bestIndex = bestIdx[i];
    let trendVal = trend[i];
    let datasets = [
      { label: chartTitles[i], data: vals, borderColor: '#2196f3', backgroundColor: 'rgba(33,150,243,0.08)', fill: false, tension:0.2, pointRadius:4, pointBackgroundColor:vals.map((v,idx)=>idx===bestIndex?'#e53935':'#2196f3') },
      { label: LANGS[lang].avgLine, data: Array(vals.length).fill(avg), borderDash:[8,4], borderColor:'#4caf50', borderWidth:1.5, fill:false, pointRadius:0, pointHoverRadius:0, pointBackgroundColor:'transparent' },
      { label: LANGS[lang].trendLine, data: getTrendline(vals), borderDash:[2,2], borderColor:'#ff9800', borderWidth:1, fill:false, pointRadius:0, pointHoverRadius:0, pointBackgroundColor:'transparent' }
    ];
    chartObjs[i] = new Chart(ctx, {
      type: 'line',
      data: { labels: labels.slice(0, vals.length), datasets },
      options: {
        responsive:true,
        plugins:{ legend:{display:true, position:'top'} },
        scales:{ y:{ beginAtZero:false, title:{display:true,text:CHARTS[i].yLabel} }, x:{ title:{display:false} } }
      }
    });
    document.getElementById('chart-title-'+(i+1)).textContent = chartTitles[i];
    // 最好成绩和激励语
    let bestStr = i===0 ? secondsToTimeStr(best) : (best||'');
    let bestLab = i===0 ? LANGS[lang].bestShort : LANGS[lang].bestHigh;
    let congrats = (vals.length && bestIndex===vals.length-1) ? ' <span class="congrats" style="color:#e53935;font-weight:bold;">'+LANGS[lang].congrats+'</span>' : '';
    let trendText = '';
    if (trendVal!==0) {
      if (i===0) trendText = trendVal<0 ? '<span style="color:#43a047;font-weight:bold;">'+LANGS[lang].great+'</span>' : '<span style="color:#e53935;font-weight:bold;">'+LANGS[lang].tryHard+'</span>';
      else trendText = trendVal>0 ? '<span style="color:#43a047;font-weight:bold;">'+LANGS[lang].great+'</span>' : '<span style="color:#e53935;font-weight:bold;">'+LANGS[lang].tryHard+'</span>';
    }
    document.getElementById('chart-best-'+(i+1)).innerHTML = bestLab+'：<span>'+bestStr+'</span>'+congrats+'<br>'+trendText;
  }
}
function getTrendline(vals) {
  let n = vals.length;
  if (n<2) return Array(n).fill(vals[0]||0);
  let x = Array.from({length:n},(_,i)=>i+1);
  let avgX = (n+1)/2;
  let avgY = vals.reduce((a,b)=>a+b,0)/n;
  let num=0,den=0;
  for (let i=0;i<n;i++) { num+=(x[i]-avgX)*(vals[i]-avgY); den+=(x[i]-avgX)*(x[i]-avgX); }
  let k = den?num/den:0, b = avgY - k*avgX;
  return x.map(xi=>k*xi+b);
} 
// 统计面板渲染
function renderStatsPanel() {
  const statsDiv = document.getElementById('statsPanel');
  if (!currentTable || !tables[currentTable] || tables[currentTable].length === 0) {
    statsDiv.style.display = 'none';
    statsDiv.innerHTML = '';
    return;
  }
  const L = LANGS[lang];
  const data = tables[currentTable];
  // 训练次数
  const total = data.length;
  // 最近训练时间 - 按训练时间排序，取最新的
  const lastTime = data.sort((a, b) => new Date(b.trainTime) - new Date(a.trainTime))[0].trainTime;
  // 平均成绩
  let avg = [0,0,0,0,0,0];
  let best = [null,null,null,null,null,null];
  for(let i=0;i<data.length;i++){
    let row = data[i];
    for(let j=0;j<6;j++){
      let v;
      if(j===0) {
        // 完成时间使用timeStrToSeconds解析
        v = timeStrToSeconds(row[COLUMNS[j+1].key]);
      } else {
        // 其他字段使用parseFloat解析
        v = parseFloat(row[COLUMNS[j+1].key]);
      }
      if(!isNaN(v)) {
        avg[j] += v;
        if(best[j]===null) best[j]=v;
        else {
          if(j===0) best[j]=Math.min(best[j],v); // 完成时间取最小
          else best[j]=Math.max(best[j],v); // 其它取最大
        }
      }
    }
  }
  for(let j=0;j<6;j++) avg[j] = avg[j]/total;
  // 进步趋势（简单线性回归斜率）
  function getTrend(vals) {
    let n=vals.length;
    if(n<2) return 0;
    let xsum=0,ysum=0,xysum=0,x2sum=0;
    for(let i=0;i<n;i++){ xsum+=i; ysum+=vals[i]; xysum+=i*vals[i]; x2sum+=i*i; }
    let slope = (n*xysum-xsum*ysum)/(n*x2sum-xsum*xsum);
    return slope;
  }
  let trends = [0,0,0,0,0,0];
  for(let j=0;j<6;j++) {
    let vals;
    if(j===0) {
      // 完成时间使用timeStrToSeconds解析
      vals = data.map(row=>timeStrToSeconds(row[COLUMNS[j+1].key])).filter(v=>!isNaN(v));
    } else {
      // 其他字段使用parseFloat解析
      vals = data.map(row=>parseFloat(row[COLUMNS[j+1].key])).filter(v=>!isNaN(v));
    }
    trends[j] = getTrend(vals);
  }
  // 渲染卡片
  let html = '<div class="stats-card" style="display:flex;gap:20px;flex-wrap:nowrap;align-items:center;justify-content:center;margin:0 0 18px 0;overflow-x:auto;">';
  html += '<div class="stats-item" style="min-width:100px;flex-shrink:0;"><div class="stats-label" style="font-size:16px;">'+L.totalTrain+'</div><div class="stats-value" style="font-size:18px;">'+total+'</div></div>';
  html += '<div class="stats-item" style="min-width:100px;flex-shrink:0;"><div class="stats-label" style="font-size:16px;">'+L.lastTrain+'</div><div class="stats-value" style="font-size:16px;">'+formatDate(new Date(lastTime))+'</div></div>';
  for(let j=0;j<6;j++) {
    let bestStr = j===0 ? secondsToTimeStr(best[j]) : (best[j]||'');
    let avgStr = j===0 ? secondsToTimeStr(avg[j]) : avg[j].toFixed(2);
    let trendStr = trends[j]===0 ? '' : (j===0 ? (trends[j]<0?'<span style="color:#43a047;">↓</span>':'<span style="color:#e53935;">↑</span>') : (trends[j]>0?'<span style="color:#43a047;">↑</span>':'<span style="color:#e53935;">↓</span>'));
    html += '<div class="stats-item" style="min-width:80px;flex-shrink:0;"><div class="stats-label" style="font-size:16px;">'+L.labels[j+1]+'</div><div class="stats-value" style="font-size:18px;">'+bestStr+'<span class="stats-sub" style="font-size:14px;">'+(lang === 'zh' ? '(最佳)' : '(Best)')+'</span></div><div class="stats-value" style="font-size:15px;color:#888;margin-top:1px;">'+avgStr+'<span class="stats-sub" style="font-size:13px;">'+(lang === 'zh' ? '(均值)' : '(Avg)')+'</span> '+trendStr+'</div></div>';
  }
  html += '</div>';
  statsDiv.innerHTML = html;
  statsDiv.style.display = '';
} 
// 悬停显示标签
let tooltipTimer = null;
document.getElementById('tableBody').addEventListener('mouseover', function(e) {
  if (e.target.tagName==='TD' && e.target.dataset.tooltip) {
    tooltipTimer = setTimeout(()=>{ e.target.classList.add('show-tooltip'); }, 1000);
  }
});
document.getElementById('tableBody').addEventListener('mouseout', function(e) {
  if (e.target.tagName==='TD' && e.target.dataset.tooltip) {
    clearTimeout(tooltipTimer); e.target.classList.remove('show-tooltip');
  }
});
// 意见反馈
document.getElementById('feedbackBtn').onclick = function() {
  alert(LANGS[lang].feedbackMsg);
};
// 删除训练项目
document.getElementById('deleteTableBtn').onclick = function() {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  if (!confirm(LANGS[lang].confirmDeleteTable)) return;
  delete tables[currentTable];
  saveTables(tables);
  refreshTableSelects();
  renderTable();
}; 
// 修改数据
window.editData = function(idx) {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  let row = tables[currentTable][idx];
  let L = LANGS[lang];
  let html = '<div id="editModal" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#0008;z-index:2000;display:flex;align-items:center;justify-content:center;">'+
    '<div style="background:#fff;padding:28px 24px;border-radius:10px;min-width:320px;max-width:90vw;box-shadow:0 2px 12px #2196f355;display:flex;flex-direction:column;gap:14px;">'+
    '<h3 style="margin:0 0 8px 0;color:#1565c0;">'+L.editTitle+'</h3>';
  for (let col of COLUMNS) {
    let v = row[col.key];
    if (col.key === 'trainTime') {
      let localVal = v ? formatDateLocal(new Date(v)) : formatDateLocal(new Date());
      html += '<label>'+col.label+'<input type="datetime-local" id="edit_'+col.key+'" style="margin-left:8px;" value="'+localVal+'"></label>';
    } else {
      html += '<label>'+col.label+'<input type="text" id="edit_'+col.key+'" style="margin-left:8px;" value="'+(v||'')+'"></label>';
    }
  }
  html += '<div style="display:flex;gap:16px;justify-content:center;margin-top:10px;">'+
    '<button id="editSaveBtn" style="background:#2196f3;color:#fff;padding:6px 18px;border:none;border-radius:6px;font-size:15px;">'+L.editSave+'</button>'+ 
    '<button id="editCancelBtn" style="background:#eee;color:#333;padding:6px 18px;border:none;border-radius:6px;font-size:15px;">'+L.editCancel+'</button>'+ 
    '</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('editCancelBtn').onclick = function() {
    document.getElementById('editModal').remove();
  };
  document.getElementById('editSaveBtn').onclick = function() {
    for (let col of COLUMNS) {
      let v = document.getElementById('edit_'+col.key).value;
      if (col.key === 'trainTime') {
        row[col.key] = v ? new Date(v).toISOString() : new Date().toISOString();
      } else {
        row[col.key] = v;
      }
    }
    tables[currentTable][idx] = JSON.parse(JSON.stringify(row));
    saveTables(tables);
    renderTable();
    renderStatsPanel(); // 新增
    document.getElementById('editModal').remove();
  };
}; 
// 自动保存提示
let saveTipTimer = null;
function showSaveTip() {
  let tip = document.getElementById('saveTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'saveTip';
    tip.style.position = 'fixed';
    tip.style.bottom = '32px';
    tip.style.left = '32px';
    tip.style.background = '#2196f3';
    tip.style.color = '#fff';
    tip.style.padding = '10px 22px';
    tip.style.borderRadius = '8px';
    tip.style.fontSize = '16px';
    tip.style.boxShadow = '0 2px 8px #2196f355';
    tip.style.zIndex = 3000;
    tip.style.opacity = 0;
    tip.style.transition = 'opacity 0.3s';
    document.body.appendChild(tip);
  }
  tip.textContent = LANGS[lang].saveTip || '已保存';
  tip.style.opacity = 1;
  clearTimeout(saveTipTimer);
  saveTipTimer = setTimeout(()=>{ tip.style.opacity = 0; }, 1800);
} 
// 备份数据（导出JSON）
document.getElementById('backupBtn').onclick = function() {
  // 收集所有数据，包括项目设置
  const backupData = {
    tables: JSON.parse(localStorage.getItem('aimbotz_local_data_tables') || '{}'),
    projectSettings: {}
  };
  
  // 收集所有项目的设置
  for (let projectName in backupData.tables) {
    const projectSettingsKey = `project_settings_${projectName}`;
    const settings = localStorage.getItem(projectSettingsKey);
    if (settings) {
      backupData.projectSettings[projectName] = JSON.parse(settings);
    }
  }
  
  const data = JSON.stringify(backupData, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aimbotz_backup_'+(new Date().toISOString().slice(0,10))+'.json';
  document.body.appendChild(a);
  a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
};
// 从导入数据中恢复项目设置
function restoreProjectSettingsFromImport() {
  // 遍历所有项目，尝试恢复其设置
  for (let projectName in tables) {
    const projectSettingsKey = `project_settings_${projectName}`;
    const savedSettings = localStorage.getItem(projectSettingsKey);
    
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        // 验证设置的有效性
        if (settings.name && settings.weapon && settings.killCount) {
          // 设置已存在且有效，无需恢复
          continue;
        }
      } catch (e) {
        // 解析失败，继续处理
      }
    }
    
    // 如果没有保存的设置或设置无效，尝试从数据中推断
    const projectData = tables[projectName];
    if (projectData && projectData.length > 0) {
      // 从数据中推断项目设置
      const inferredSettings = inferProjectSettingsFromData(projectData, projectName);
      if (inferredSettings) {
        localStorage.setItem(projectSettingsKey, JSON.stringify(inferredSettings));
      }
    }
  }
  
  // 如果当前有选中的项目，更新显示
  if (currentTable) {
    loadProjectSettingsByName(currentTable);
    updateProjectInfoDisplay();
  }
}

// 从数据中推断项目设置
function inferProjectSettingsFromData(data, projectName) {
  // 默认设置
  const defaultSettings = {
    name: projectName,
    weapon: '', // 无法从数据中推断武器类型
    killCount: 100 // 默认击杀数
  };
  
  // 尝试从数据中推断击杀数
  if (data.length > 0) {
    // 使用数据长度作为击杀数的参考
    defaultSettings.killCount = Math.max(100, data.length * 10);
  }
  
  return defaultSettings;
}

// 恢复数据（导入JSON）
document.getElementById('restoreBtn').onclick = function() {
  let input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = function(e) {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function(ev) {
      try {
        let obj = JSON.parse(ev.target.result);
        if (typeof obj !== 'object' || Array.isArray(obj)) throw 0;
        
        // 检查是否是新的备份格式（包含项目设置）
        let dataToImport = obj;
        let projectSettingsToImport = {};
        
        if (obj.tables && obj.projectSettings) {
          // 新格式：包含项目设置的备份
          dataToImport = obj.tables;
          projectSettingsToImport = obj.projectSettings;
        }
        
        // 审查机制：全表去重
        let oldTables = loadTables();
        let merged = {};
        for (let key in dataToImport) {
          let arr = dataToImport[key] || [];
          let exist = (oldTables[key]||[]).map(row=>JSON.stringify(row));
          merged[key] = (oldTables[key]||[]).concat(arr.filter(row=>!exist.includes(JSON.stringify(row))));
        }
        tables = merged;
        saveTables(tables);
        
        // 恢复项目设置
        for (let projectName in projectSettingsToImport) {
          const settings = projectSettingsToImport[projectName];
          if (settings && typeof settings === 'object') {
            localStorage.setItem(`project_settings_${projectName}`, JSON.stringify(settings));
          }
        }
        
        refreshTableSelects();
        renderTable();
        renderStatsPanel();
        
        // 如果当前有选中的项目，更新显示
        if (currentTable) {
          loadProjectSettingsByName(currentTable);
          updateProjectInfoDisplay();
        }
        
        showSaveTip();
        alert(LANGS[lang].restoreSuccess);
      } catch {
        alert(LANGS[lang].restoreFail);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}; 
// 主题切换
const THEME_KEY = 'aimbotz_theme';
let theme = localStorage.getItem(THEME_KEY) || 'light';
function setTheme(t) {
  theme = t;
  localStorage.setItem(THEME_KEY, t);
  if (t === 'night') document.body.classList.add('night');
  else document.body.classList.remove('night');
  renderThemeBtn();
}
function renderThemeBtn() {
  const btn = document.getElementById('themeToggleBtn');
  btn.textContent = (lang==='zh') ? (theme==='night'?'日间模式':'夜间模式') : (theme==='night'?'Day Mode':'Night Mode');
}
document.getElementById('themeToggleBtn').onclick = function() {
  setTheme(theme==='night'?'light':'night');
};
// 语言切换时同步主题按钮文字
const _setLang = setLang;
setLang = function(l) {
  _setLang(l);
  renderThemeBtn();
};
// 页面加载时应用主题
setTheme(theme); 
// 导出/导入菜单弹窗
function showMenuDialog(type) {
  let L = LANGS[lang];
  let html = '<div id="menuDialog" style="position:fixed;z-index:3002;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#0005;">';
  html += '<div class="menu-dialog-box" style="background:'+(theme==='night'?'#23283a':'#fff')+';color:'+(theme==='night'?'#e3e6ef':'#222')+';padding:32px 28px 24px 28px;border-radius:16px;min-width:220px;max-width:96vw;box-shadow:0 4px 24px #2196f355;display:flex;flex-direction:column;gap:18px;align-items:center;">';
  html += '<h3 style="margin:0 0 12px 0;font-size:20px;color:#1565c0;letter-spacing:1px;">'+(type==='export'?L.export:L.import)+'</h3>';
  if(type==='export') {
    html += '<button id="exportExcelBtn" class="blue-btn" style="width:160px;margin-bottom:8px;">'+L.exportExcel+'</button>';
    html += '<button id="exportJsonBtn" class="blue-btn" style="width:160px;">'+L.exportJson+'</button>';
  } else {
    html += '<button id="importExcelBtn" class="blue-btn" style="width:160px;margin-bottom:8px;">'+L.importExcel+'</button>';
    html += '<button id="importJsonBtn" class="blue-btn" style="width:160px;">'+L.importJson+'</button>';
  }
  html += '<button id="menuDialogCancel" class="red-btn" style="width:160px;margin-top:16px;">'+L.cancel+'</button>';
  html += '</div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('menuDialogCancel').onclick = function(){ document.getElementById('menuDialog').remove(); };
  if(type==='export') {
    document.getElementById('exportExcelBtn').onclick = function(){ document.getElementById('menuDialog').remove(); document.getElementById('exportCurrentBtn').click(); };
    document.getElementById('exportJsonBtn').onclick = function(){ document.getElementById('menuDialog').remove(); document.getElementById('backupBtn').click(); };
  } else {
    document.getElementById('importExcelBtn').onclick = function(){ document.getElementById('menuDialog').remove(); document.getElementById('importBtn').click(); };
    document.getElementById('importJsonBtn').onclick = function(){ document.getElementById('menuDialog').remove(); document.getElementById('restoreBtn').click(); };
  }
  document.getElementById('menuDialog').onclick = function(e){ if(e.target===this) this.remove(); };
}
document.getElementById('exportMenuBtn').onclick = function(){ showMenuDialog('export'); };
document.getElementById('importMenuBtn').onclick = function(){ showMenuDialog('import'); }; 
// 悬浮跳转按钮逻辑
document.getElementById('gotoTableBtn').onclick = function() {
  window.scrollTo({top:0, left:0, behavior:'smooth'});
};
document.getElementById('gotoChartsBtn').onclick = function() {
  const charts = document.querySelector('.charts');
  if(charts) charts.scrollIntoView({behavior:'smooth', block:'start'});
};
// 初始化渲染
refreshTableSelects();
renderTable();
renderStatsPanel();
renderLang();

// 初始化项目设置显示
updateProjectInfoDisplay();

// 如果有当前项目，加载其设置
if (currentTable) {
  loadProjectSettingsByName(currentTable);
  updateProjectInfoDisplay();
}

document.getElementById('deleteAllBtn').onclick = function() {
  if (!currentTable) return alert(LANGS[lang].pleaseSelectTable);
  if (!confirm(LANGS[lang].confirmDeleteAll)) return;
  if (!(currentTable in tables)) return;
  tables[currentTable] = [];
  saveTables(tables);
  renderTable();
  renderStatsPanel();
};
document.getElementById('tutorialBtn').onclick = function() {
    if (lang === 'zh') {
      window.open('https://github.com/ShayerLee/Aimbotz-Training-record-analysis-webpage/blob/main/README_CN.md', '_blank'); 
    } else {
      window.open('https://github.com/ShayerLee/Aimbotz-Training-record-analysis-webpage/blob/main/README.md', '_blank'); 
    }
};

// 项目设置相关函数
function showProjectSettingsModal() {
  const modal = document.getElementById('projectSettingsModal');
  const projectSelect = document.getElementById('projectSelect');
  const nameInput = document.getElementById('projectNameInput');
  const weaponSelect = document.getElementById('projectWeaponSelect');
  const killCountSelect = document.getElementById('projectKillCountSelect');
  const killCountInput = document.getElementById('projectKillCountInput');
  
  // 填充项目选择下拉菜单
  let selectProjectText = '请选择项目';
  if (lang === 'en') selectProjectText = 'Please select project';
  else if (lang === 'ru') selectProjectText = 'Пожалуйста, выберите проект';
  projectSelect.innerHTML = `<option value="">${selectProjectText}</option>`;
  Object.keys(tables).forEach(projectName => {
    const option = document.createElement('option');
    option.value = projectName;
    option.textContent = projectName;
    projectSelect.appendChild(option);
  });
  
  // 重新生成武器选择选项
  generateWeaponOptions(weaponSelect);
  
  // 填充当前设置
  nameInput.value = currentProject.name;
  weaponSelect.value = currentProject.weapon;
  
  // 设置击杀数量下拉菜单
  const currentKillCount = currentProject.killCount || 100;
  const presetValues = [100, 250, 500, 1000];
  
  if (presetValues.includes(currentKillCount)) {
    killCountSelect.value = currentKillCount.toString();
    killCountInput.style.display = 'none';
  } else {
    killCountSelect.value = 'custom';
    killCountInput.style.display = 'block';
    killCountInput.value = currentKillCount;
  }
  
  // 更新武器速度显示
  updateProjectWeaponSpeedDisplay();
  
  modal.style.display = 'flex';
}

// 生成武器选项（包含开镜选项）
function generateWeaponOptions(weaponSelect) {
  let placeholderText = '请选择武器';
  if (lang === 'en') placeholderText = 'Please select weapon';
  else if (lang === 'ru') placeholderText = 'Пожалуйста, выберите оружие';
  weaponSelect.innerHTML = `<option value="" id="projectWeaponPlaceholder">${placeholderText}</option>`;
  
  // 增加默认选项
  let defaultText = '默认';
  if (lang === 'en') defaultText = 'Default';
  else if (lang === 'ru') defaultText = 'По умолчанию';
  let defaultOption = document.createElement('option');
  defaultOption.value = 'default';
  defaultOption.textContent = defaultText + ' (240)';
  weaponSelect.appendChild(defaultOption);
  
  // 可开镜的武器列表
  const scopedWeapons = ['aug', 'sg553', 'awp', 'scar20', 'g3sg1'];
  
  // 手枪
  let pistolGroup = document.createElement('optgroup');
  let pistolLabel = '手枪';
  if (lang === 'en') pistolLabel = 'Pistols';
  else if (lang === 'ru') pistolLabel = 'Пистолеты';
  pistolGroup.label = pistolLabel;
  ['usp', 'glock', 'p2000', 'p250', 'dual_berettas', 'fn57', 'tec9', 'cz75', 'deagle', 'r8', 'taser'].forEach(weapon => {
    let option = document.createElement('option');
    option.value = weapon;
    option.textContent = getWeaponDisplayName(weapon);
    pistolGroup.appendChild(option);
  });
  weaponSelect.appendChild(pistolGroup);
  
  // 冲锋枪
  let smgGroup = document.createElement('optgroup');
  let smgLabel = '冲锋枪';
  if (lang === 'en') smgLabel = 'SMGs';
  else if (lang === 'ru') smgLabel = 'Пистолеты-Пулеметы';
  smgGroup.label = smgLabel;
  ['mac10', 'mp9', 'bizon', 'mp5', 'ump45', 'p90', 'mp7'].forEach(weapon => {
    let option = document.createElement('option');
    option.value = weapon;
    option.textContent = getWeaponDisplayName(weapon);
    smgGroup.appendChild(option);
  });
  weaponSelect.appendChild(smgGroup);
  
  // 步枪
  let rifleGroup = document.createElement('optgroup');
  let rifleLabel = '步枪';
  if (lang === 'en') rifleLabel = 'Rifles';
  else if (lang === 'ru') rifleLabel = 'Винтовки';
  rifleGroup.label = rifleLabel;
  ['m4a1', 'm4a4', 'famas', 'aug', 'ak47', 'galil', 'sg553'].forEach(weapon => {
    let option = document.createElement('option');
    option.value = weapon;
    option.textContent = getWeaponDisplayName(weapon);
    rifleGroup.appendChild(option);
    if (scopedWeapons.includes(weapon)) {
      let scopedOption = document.createElement('option');
      scopedOption.value = weapon + '_scoped';
      let scopedText = '';
      if (lang === 'zh') scopedText = ' (开镜)';
      else if (lang === 'en') scopedText = ' (Scoped)';
      else if (lang === 'ru') scopedText = ' (С Прицелом)';
      scopedOption.textContent = getWeaponDisplayName(weapon) + scopedText;
      rifleGroup.appendChild(scopedOption);
    }
  });
  weaponSelect.appendChild(rifleGroup);
  
  // 狙击枪
  let sniperGroup = document.createElement('optgroup');
  let sniperLabel = '狙击枪';
  if (lang === 'en') sniperLabel = 'Snipers';
  else if (lang === 'ru') sniperLabel = 'Снайперские Винтовки';
  sniperGroup.label = sniperLabel;
  ['ssg08', 'awp', 'scar20', 'g3sg1'].forEach(weapon => {
    let option = document.createElement('option');
    option.value = weapon;
    option.textContent = getWeaponDisplayName(weapon);
    sniperGroup.appendChild(option);
    if (scopedWeapons.includes(weapon)) {
      let scopedOption = document.createElement('option');
      scopedOption.value = weapon + '_scoped';
      let scopedText = '';
      if (lang === 'zh') scopedText = ' (开镜)';
      else if (lang === 'en') scopedText = ' (Scoped)';
      else if (lang === 'ru') scopedText = ' (С Прицелом)';
      scopedOption.textContent = getWeaponDisplayName(weapon) + scopedText;
      sniperGroup.appendChild(scopedOption);
    }
  });
  weaponSelect.appendChild(sniperGroup);
  
  // 霰弹枪
  let shotgunGroup = document.createElement('optgroup');
  let shotgunLabel = '霰弹枪';
  if (lang === 'en') shotgunLabel = 'Shotguns';
  else if (lang === 'ru') shotgunLabel = 'Дробовики';
  shotgunGroup.label = shotgunLabel;
  ['nova', 'xm1014', 'mag7', 'sawedoff'].forEach(weapon => {
    let option = document.createElement('option');
    option.value = weapon;
    option.textContent = getWeaponDisplayName(weapon);
    shotgunGroup.appendChild(option);
  });
  weaponSelect.appendChild(shotgunGroup);
  
  // 机枪
  let lmgGroup = document.createElement('optgroup');
  let lmgLabel = '机枪';
  if (lang === 'en') lmgLabel = 'LMGs';
  else if (lang === 'ru') lmgLabel = 'Пулеметы';
  lmgGroup.label = lmgLabel;
  ['m249', 'negev'].forEach(weapon => {
    let option = document.createElement('option');
    option.value = weapon;
    option.textContent = getWeaponDisplayName(weapon);
    lmgGroup.appendChild(option);
  });
  weaponSelect.appendChild(lmgGroup);
}

function hideProjectSettingsModal() {
  document.getElementById('projectSettingsModal').style.display = 'none';
}

function updateProjectWeaponSpeedDisplay() {
  const weaponSelect = document.getElementById('projectWeaponSelect');
  const selectedWeapon = weaponSelect.value;
  
  let baseSpeed = 240;
  let weaponName = '';
  if (lang === 'zh') weaponName = '默认';
  else if (lang === 'en') weaponName = 'Default';
  else if (lang === 'ru') weaponName = 'По Умолчанию';
  let isScoped = false;
  
  if (selectedWeapon) {
    // 检查是否包含开镜标识
    if (selectedWeapon.includes('_scoped')) {
      const baseWeapon = selectedWeapon.replace('_scoped', '');
      isScoped = true;
      baseSpeed = WEAPON_SCOPED_SPEEDS[baseWeapon] || WEAPON_SPEEDS[baseWeapon] || 240;
      let scopedText = '';
      if (lang === 'zh') scopedText = ' (开镜)';
      else if (lang === 'en') scopedText = ' (Scoped)';
      else if (lang === 'ru') scopedText = ' (С Прицелом)';
      weaponName = getWeaponDisplayName(baseWeapon) + scopedText;
    } else {
      baseSpeed = WEAPON_SPEEDS[selectedWeapon] || 240;
      weaponName = getWeaponDisplayName(selectedWeapon);
    }
  }
  
  // 更新显示
  const speedDisplay = document.getElementById('projectWeaponSpeedDisplay');
  if (speedDisplay) {
    let baseSpeedText = '';
    if (lang === 'zh') baseSpeedText = '基准速度';
    else if (lang === 'en') baseSpeedText = 'Base Speed';
    else if (lang === 'ru') baseSpeedText = 'Базовая Скорость';
    speedDisplay.textContent = `${baseSpeedText}: ${baseSpeed} (${weaponName})`;
  }
}

function updateProjectInfoDisplay() {
  const display = document.getElementById('projectInfoDisplay');
  if (display) {
    const L = LANGS[lang];
    
    let name = currentProject.name;
    if (!name) {
      if (lang === 'zh') name = '未设置';
      else if (lang === 'en') name = 'Not Set';
      else if (lang === 'ru') name = 'Не Установлено';
    }
    
    let weapon = '';
    if (lang === 'zh') weapon = '未选择';
    else if (lang === 'en') weapon = 'Not Selected';
    else if (lang === 'ru') weapon = 'Не Выбрано';
    
    if (currentProject.weapon) {
      if (currentProject.weapon.includes('_scoped')) {
        const baseWeapon = currentProject.weapon.replace('_scoped', '');
        let scopedText = '';
        if (lang === 'zh') scopedText = ' (开镜)';
        else if (lang === 'en') scopedText = ' (Scoped)';
        else if (lang === 'ru') scopedText = ' (С Прицелом)';
        weapon = getWeaponDisplayName(baseWeapon) + scopedText;
      } else {
        weapon = getWeaponDisplayName(currentProject.weapon);
      }
    }
    
    const killCount = currentProject.killCount || 100;
    
    let projectText = '';
    let weaponText = '';
    let killsText = '';
    
    if (lang === 'zh') {
      projectText = '项目';
      weaponText = '武器';
      killsText = '击杀数';
    } else if (lang === 'en') {
      projectText = 'Project';
      weaponText = 'Weapon';
      killsText = 'Kills';
    } else if (lang === 'ru') {
      projectText = 'Проект';
      weaponText = 'Оружие';
      killsText = 'Убийства';
    }
    
    display.textContent = `${projectText}: ${name} | ${weaponText}: ${weapon} | ${killsText}: ${killCount}`;
  }
}

function saveProjectSettings() {
  const projectSelect = document.getElementById('projectSelect');
  const nameInput = document.getElementById('projectNameInput');
  const weaponSelect = document.getElementById('projectWeaponSelect');
  const killCountSelect = document.getElementById('projectKillCountSelect');
  const killCountInput = document.getElementById('projectKillCountInput');
  
  // 验证输入
  const L = LANGS[lang];
  if (!projectSelect.value) {
    let errorMsg = '请选择要修改的项目！';
    if (lang === 'en') errorMsg = 'Please select a project to modify!';
    else if (lang === 'ru') errorMsg = 'Пожалуйста, выберите проект для изменения!';
    alert(errorMsg);
    return;
  }
  
  if (!nameInput.value.trim()) {
    alert(L.pleaseEnterProjectName);
    return;
  }
  
  if (!weaponSelect.value) {
    alert(L.pleaseSelectWeapon);
    return;
  }
  
  const oldProjectName = projectSelect.value;
  const newProjectName = nameInput.value.trim();
  
  // 检查新项目名是否已存在（排除当前项目）
  if (newProjectName !== oldProjectName && newProjectName in tables) {
    alert(LANGS[lang].projectExists);
    return;
  }
  
  // 如果项目名改变了，需要重命名项目
  if (newProjectName !== oldProjectName) {
    tables[newProjectName] = tables[oldProjectName];
    delete tables[oldProjectName];
    currentTable = newProjectName;
    saveTables(tables);
    refreshTableSelects();
  }
  
  // 获取击杀数量
  let killCount = 100;
  if (killCountSelect.value === 'custom') {
    killCount = parseInt(killCountInput.value) || 100;
  } else {
    killCount = parseInt(killCountSelect.value) || 100;
  }
  
  // 保存项目设置
  currentProject.name = newProjectName;
  currentProject.weapon = weaponSelect.value;
  currentProject.killCount = killCount;
  
  // 保存到本地存储
  localStorage.setItem(PROJECT_SETTINGS_KEY, JSON.stringify(currentProject));
  
  // 保存项目特定的设置
  localStorage.setItem(`project_settings_${newProjectName}`, JSON.stringify({
    name: newProjectName,
    weapon: weaponSelect.value,
    killCount: killCount
  }));
  
  // 更新显示
  updateProjectInfoDisplay();
  
  // 隐藏对话框
  hideProjectSettingsModal();
  
  // 显示保存提示
  showSaveTip();
}

// 项目设置事件监听器
document.addEventListener('DOMContentLoaded', function() {
  
  // 保存设置按钮
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  if (saveProjectBtn) {
    saveProjectBtn.addEventListener('click', saveProjectSettings);
  }
  
  // 取消按钮
  const cancelProjectBtn = document.getElementById('cancelProjectBtn');
  if (cancelProjectBtn) {
    cancelProjectBtn.addEventListener('click', hideProjectSettingsModal);
  }
  
  // 武器选择变化时更新速度显示
  const projectWeaponSelect = document.getElementById('projectWeaponSelect');
  
  if (projectWeaponSelect) {
    projectWeaponSelect.addEventListener('change', updateProjectWeaponSpeedDisplay);
  }
  
  // 击杀数量下拉菜单变化时处理
  const killCountSelect = document.getElementById('projectKillCountSelect');
  if (killCountSelect) {
    killCountSelect.addEventListener('change', function() {
      const killCountInput = document.getElementById('projectKillCountInput');
      if (this.value === 'custom') {
        killCountInput.style.display = 'block';
        killCountInput.focus();
      } else {
        killCountInput.style.display = 'none';
      }
    });
  }
  
  // 项目选择变化时填充设置
  const projectSelect = document.getElementById('projectSelect');
  if (projectSelect) {
    projectSelect.addEventListener('change', function() {
      const selectedProject = this.value;
      if (selectedProject) {
        // 加载选中项目的设置
        loadProjectSettingsByName(selectedProject);
        
        // 填充表单
        const nameInput = document.getElementById('projectNameInput');
        const weaponSelect = document.getElementById('projectWeaponSelect');
        const killCountSelect = document.getElementById('projectKillCountSelect');
        const killCountInput = document.getElementById('projectKillCountInput');
        
        nameInput.value = currentProject.name;
        weaponSelect.value = currentProject.weapon;
        
        // 设置击杀数量下拉菜单
        const currentKillCount = currentProject.killCount || 100;
        const presetValues = [100, 250, 500, 1000];
        
        if (presetValues.includes(currentKillCount)) {
          killCountSelect.value = currentKillCount.toString();
          killCountInput.style.display = 'none';
        } else {
          killCountSelect.value = 'custom';
          killCountInput.style.display = 'block';
          killCountInput.value = currentKillCount;
        }
        
        updateProjectWeaponSpeedDisplay();
      }
    });
  }
  
  // 点击模态框外部关闭
  const modal = document.getElementById('projectSettingsModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        hideProjectSettingsModal();
      }
    });
  }
  
  // 加载项目设置
  loadProjectSettings();
  
  // 修改项目按钮事件监听器
  const editProjectBtn = document.getElementById('editProjectBtn');
  if (editProjectBtn) {
    editProjectBtn.addEventListener('click', function() {
      if (!currentTable) {
        alert(LANGS[lang].pleaseSelectTable);
        return;
      }
      showProjectSettingsModal();
      
      // 自动选择当前项目
      const projectSelect = document.getElementById('projectSelect');
      if (projectSelect) {
        projectSelect.value = currentTable;
        // 触发change事件
        projectSelect.dispatchEvent(new Event('change'));
      }
    });
  }
}); 