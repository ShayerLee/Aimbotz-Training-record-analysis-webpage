# Import/Export Tutorial
## Clicking "Export" allows you to export files in two formats: Excel and JSON<br>
<img width="1213" height="789" alt="image" src="https://github.com/user-attachments/assets/75e085dd-cb4a-43b7-bc5e-03cc17f53759" /><br>
## Clicking "Import" will allow the recognition and import of the two types of exported files<br>
<img width="1243" height="818" alt="image" src="https://github.com/user-attachments/assets/80272d4d-26db-431e-80b1-bfd746b4296e" /><br>
## If you want to import your previous records, please format your Excel file in the following order
<br>
"训练时间"="Train Time";<br>
"完成时间"="Finish Time";
<br>
"每分钟击杀"="Kills/Min";
<br>
"每秒击杀"="Kills/Sec";
<br>
"准确率"="Accuracy";
<br>
"急停成功率"="Stop Success Rate";
<br>
"急停击杀率"="Stop Kill Rate"
<br>
<img width="1919" height="1015" alt="image" src="https://github.com/user-attachments/assets/1f2c597b-4dc2-440a-b27b-06164b4fb875" />

You can also download the template: [This is the template](template.elxe)<br>

## The Aimbotz data corresponding to each parameter is as follows:
<br>
Train time => The time you conducted this training, in the format of "year-month-day hour:minute"; for example, "2025-07-28 13:42"<br>
Finish Time => the numerical value following "Finished In: ", as shown in the figure as "00:13.174"<br>
Kills/Min=> The numerical value following the label, as shown in the figure as "45.54"<br>
Kills/Sec=> The numerical value following the text, as indicated by "0.76" in the image<br>
Accuracy=> 1 divided by the value after "Shots per Kill:" as shown in the figure, such as "2.9". 1/2.9=0.345<br>
Stop Success Rate=> the standard deviation (std) after "Move Speed Shot (Avg/Median/Std): ", as shown as "84.1" in the figure<br>
Stop Kill Rate=>The standard deviation (std) after the "Move Speed Kill (Avg/Median/Std): " is the emergency stop kill rate, as indicated by "19.1" in the figure<br>
<img width="478" height="339" alt="image" src="https://github.com/user-attachments/assets/00e6882e-835e-4e1e-b8b2-fef2f9a3f958" />
