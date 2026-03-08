
|<div style="width:200px"></div>|<div style="width:250px"></div>|
|:---|---|
|Introduction to the<br>**Apache Daffodil Extension** <br>for <br>**Visual Studio Code**<br><br>|![](images/new_users/VSCode_Extension0.png)|


|<div style="width:160px"></div>|<div style="width:325px"></div>|
|:---|---|
|**The Mission:<br>Make Daffodil Coding & Debugging Easier**<br><br><br><br>The Command Line Interface with existing Daffodil debugging capability is non\-intuitive and difficult to master<br><br><br><br><br><br><br><br>|![](images/new_users/VSCode_Extension4.png)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|---|
|**The Solution:<br>Integrate Daffodil with VS Code**<br><ul><li>Source Level Debugging</li><li> Breakpoints</li><li>Single Stepping</li><li>Syntax Highlighting</li><li>Context Aware Code Completion Assistance</li><li>Data view & Location Tracking</li><li>Interactive Infoset Viewing</li></ul>|![](images/new_users/VSCode_Extension1.png)|



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|---|
|**The How:**<br><br><br><br><br><br><ul><li>VS Code plug\-in extension</li><li>DAPodil interface server</li><li>Ωedit \& Data Editor</li><li>Apache Daffodil w/ integrated Debugger</li></ul><br><br><br><br>|![](images/new_users/VSCode_Extension4x.png)|



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**The Caveats:**<br><br><br><br><ul><li>No new functionality has been added to Daffodil’s integrated debugger</li><li>VS Code simply provides a simpler\, more intuitive user interface</li><li>Not all debugger capabilities are available via VS Code\.</li></ul>|<ul><li>The code being executed within Daffodil is a parser that it constructed based upon the provided schema\.</li><li>There is  ***not***  a one\-to\-one correspondence between the schema structure and that of the parser.  This means that there is  ***not***  a one\-to\-one correspondence between the lines in the schema and what Daffodil executes when the user asks the debugger to “step”.</li><li>There will be instances where the “step” does not result in movement of the indicator showing current location within the schema\.  This is similar to\, but more exaggerated than\, debugging code compiled with optimization enabled\.</li><li>Additionally\, data shown in the infoset may appear in chunks and/or may be removed when the parser backtracks if a parse branch is found to be incorrect\.</li></ul>|

**Don’t worry if you’re new to IDE use and don’t know what any of this means\. We’ll cover it in detail later\.**


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**IDE Basics**<br><br>Integrated Development Environment<br>A single program that integrates all the steps of software development<ul><li>***Editing***</li><li>Compiling</li><li>Execution</li><li>Debugging</li><li>Version Control</li></ul>|![](images/new_users/Basic_1.png)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**IDE Basics**<br><br>Integrated Development Environment<br>A single program that integrates all the steps of software development<ul><li>Editing</li><li>***Compiling***</li><li>Execution</li><li>Debugging</li><li>Version Control</li></ul>|![](images/new_users/Basic_2.png)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**IDE Basics**<br><br>Integrated Development Environment<br>A single program that integrates all the steps of software development<ul><li>Editing</li><li>Compiling</li><li>***Execution***</li><li>Debugging</li><li>Version Control</li></ul>|![](images/new_users/Basic_3.png)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**IDE Basics**<br><br>Integrated Development Environment<br>A single program that integrates all the steps of software development<ul><li>Editing</li><li>Compiling</li><li>Execution</li><li>***Debugging***</li><li>Version Control</li></ul>|![](images/new_users/Basic_4.png)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**IDE Basics**<br><br>Integrated Development Environment<br>A single program that integrates all the steps of software development<ul><li>Editing</li><li>Compiling</li><li>Execution</li><li>Debugging</li><li>***Version Control***</li></ul>|![](images/new_users/Basic_5.png)|



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---:|
|Install VS Code<br><br><br><br><ul><li>Free and built on open source</li><li>Available for Windows, Linux, macOS and web browsers</li></ul><br><br><br>|<br>*Click Image for Download Page:*[![Supported platforms](images/new_users/VSCode_Install.png "Download VS Code Here")](https://code.visualstudio.com/Download)|




|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**Installing the Daffodil Extension**<br><br><ol><li>***In VS Code, click on the Extensions Icon.*** <br>![](img/VSCode_Extension16.png)</li></ol><br><br><br><br><br><br>|![](images/new_users/Extension_Install_1.png)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**Installing the Daffodil Extension**<br><br><ol><li>In VS Code, click on the Extensions Icon</li><li>***Then enter “daffodil” in the search box***</li><br><br><br><br></ol>|![](images/new_users/Extension_Install_2.png)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**Installing the Daffodil Extension**<br><br><ol><li>In VS Code, click on the Extensions Icon.</li><li>Then enter “daffodil” in the search box</li><li>***Click on the Apache Daffodil tile***</li><br><br><br>|![](images/new_users/Extension_Install_3.png)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**Installing the Daffodil Extension**<br><br><ol><li>In VS Code, click on the Extensions Icon.</li><li>Then enter “daffodil” in the search box</li><li>Click on the Apache Daffodil tile</li><li>***Click on the***  `Install` ***button***</li><br><br>|![](images/new_users/Extension_Install_4.png)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|**Installing the Daffodil Extension**<br><br><ol><li>In VS Code, click on the Extensions Icon.</li><li>Then enter “daffodil” in the search box</li><li>Click on the Apache Daffodil tile</li><li>Click on the Install button</li><li>***Upon installation, the*** `Install` ***button will be replaced by*** `Disable` ***&*** `Uninstall` ***buttons***</li></ol>|![](images/new_users/Extension_Install_5.png)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---:|
|***Configuring for First Use***<br>*Create a working directory*<br><ul><li>Sample data file</li><li>Sample schema file</ul><br><br><br>*[Free sample schemas here](https://github.com/DFDLSchemas)*|![](images/new_users/VSCode_Extension18.png)*This example uses a Daffdile logo saved as a PNG file*|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Open the working directory*<br><br><br><ol><li>Click `File`</li><li>Click `Open Folder`</li><li>Navigate to & Select your folder<br><br><br></ol></li><br><br>|![](images/new_users/Open_Folder.png)|

Note that if you wind up working on multiple DFDL projects in different folders, you will need to configure **each folder** with its own launch.json file

Another important issue to note when choosing working directories is that VSCode, like many IDEs, seems to not like projects that are on paths reachable via symlinks. Using symlinks in paths is highly likely to cause problems and thus should be avoided.

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Configuring Launch.json file*<br><br><ul><li>Open the *Launch Config Wizard*<ul><li>Press `Ctrl` + `Shift` + `P`</li><li>In the search bar that opens, begin entering: "Daffodil"</li><li>When the list shows `Daffdodil Debug: Configure launch.json`, select it</li></ul></li></ul>|![commandpalletedaff](https://github.com/user-attachments/assets/a9ad737b-2feb-4c77-a7af-b2191f5b59fd)|
|<ul><li>The Launch Config Wizard will open in a new tab.</li></ul><br><br><br><br><br><br>|![](images/new_users/Launch_Config_0.png)|

Note that the debugger **should** run with the **default settings**. You may simply scroll down to the bottom of the configuration wizard and click the `SAVE` button, then close the wizard.<br>If you run into a problem, the most likely problem is that you have not yet opened a working folder/directory. If VS Code opens settings.json instead of launch.json make sure that you have created and opened the intended folder/directory. The second most likely culprit is a port conflict and you can simply reopen the configuration wizard and change the port settings and save the new configuration. 

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*<br><br><ul><li>Launch config: The file can hold multiple configurations.</li><ul><p>1. Enter a name for the new configuration<br>&emsp;&emsp;&emsp;or<br>2. Select a previous configuration from the drop-down list</p>|![](images/new_users/Launch_Config.png)|



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*||
|*Main Schema File/Input Data File*<br>The input files can be hard coded into the configuration by clicking the `Browse` button and navigating to the file and clicking on it|![](images/new_users/Input_Files.png)|

Leave the `${command:AskForSchemaName}`/`${command:AskForDataName}` values and you will be prompted for the file names each time you execute a parse. *This option can be useful if you will be testing with a variety of input files, rather than running the same files repeatedly*



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*||
|*Root Element*<br>For simple schemas, this field may be left set to `undefined` |![](images/new_users/Root_Element.png)|



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*||
|*Debugger Settings*<br><ul><li>Port - Port used for communication between VS Code & Daffodil Debugger.</li><li>Version (Daffodil version) - Specify the version of Daffodil to be used while debugging.</li><li>Timeout - Limit on communication failure before error declared.</li><li>Log File - Specify name & location of the log file.</li><li>Log Level - specify the level of information to be logged.</li><li>Use Existing Server - *ignore* - Used only for backend server developers</li><li>Stop On Entry - Essentially sets a breakpoint on the first line.</li><li>Trace - logging of internal communications</li></ul>|<img src="https://github.com/user-attachments/assets/df600e97-616a-496d-8bfa-4f04655cdb63" />|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*||
|*Classpath*<br><ul><li>Complex schemas often require multiple locations and JAR files. The debugger needs to know where to find these additional files</li></ul>*Infoset*<ul><li>Infoset Format - Select XML or JSON for the ouput</li><li>Output Type - store output to a file or stream to console</li><li>Output Infoset Path - specify the location for the output file</li></ul>|![](images/new_users/Debugger_Settings_2.png)|



|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*||
|<ul><li>Open Data Editor - Display contents of file being parsed. Defaults to Hex, but many configurable settings. Tracks position in file and allows modification of data.</li><li>Open Infoset Diff View - Can show the difference between output results of the current and previous parse.</li><li>Open Infoset View - Displays the partial resulting output of the file parsing. Note that parser often backtracks when portions of the parse are determined to be incorrect.</li></ul>|![](images/new_users/Open_Options.png)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Debugging for the first time for Visual Studio Code***||
|Make sure you have open data editor on debug start checked in launch config wizard|![commandpalletedaff](https://github.com/user-attachments/assets/7fa26b7f-0e79-40e8-9927-03444dfc1acc)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*<br>TDML Options||
|<ul><li>Drop down list of valid TDML Actions.</li><li>Desired filename for the TDML file.</li></ul>|![](https://github.com/user-attachments/assets/1b4d83d0-0430-48c5-9e53-eddccc48b9bf)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*<br>Data Editor Configuration||
|<ul><li>Omega-edit port - allows user to specify which port will be used for communication between VS Code & the backend server.</li><li>Name/location of the log file which records communication between VS Code and the backend server.</li><li>Drop down list of the valid log levels.</li></ul>|![](images/new_users/Data_Editor_Settings.png)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Configuring for First Use***<br>*Launch Config Wizard*||
|Don't forget to save your configuration settings!<br><br>If you have a problem saving your settings, verify that you have opened a valid working folder.|![](images/new_users/Save.png)|
|||


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Debugging for the first time for Visual Studio Code***||
|Click on play button to start a DFDL schema debugging session|![commandpalletedaff](https://github.com/user-attachments/assets/21f39fea-355d-4f98-86ae-7a3989d9ea43)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Debugging for the first time for Visual Studio Code***||
|You will see the data editor pop up!|![commandpalletedaff](https://github.com/user-attachments/assets/56ac7f2d-6889-4a93-8bbe-052b20129e91)|


|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Generate TDML Temporary File***||
|In launch config wizard, set TDML action to generate, and save. <br><br> ***Note: You can go back to previously set configs and edit them and save those changes***|![](https://github.com/user-attachments/assets/1b4d83d0-0430-48c5-9e53-eddccc48b9bf)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Generate TDML Temporary File***||
|Run the corresponding DFDL debug extension from prior step.<br><br>|![](https://github.com/user-attachments/assets/6d12c699-712f-48d5-b792-4bd496ec0438)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Generate Temporary TDML File***||
|Press the continue button to produce the infoset.<br><br>|![](https://github.com/user-attachments/assets/4831667c-9d61-405d-8781-5bf00b71fa0c)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Generate Temporary TDML File***||
|When the infoset generates, a temporary TDML schema will generate.<br><br>|![](https://github.com/user-attachments/assets/1aafeeaa-e7b1-4e47-9b77-587246990392)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Create TDML File***||
|Close all windows except the DFDL schema window.  Click “Create TDML File” in the command view panel or "Daffodil Debug: Create TDML File" in the command palette.<br><br>|![](https://github.com/user-attachments/assets/b45f6da9-9d87-4cee-ad9d-310b09476792)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Create TDML File***||
|Enter a name for the TDML file, click “Save TDML File. Save the TDML in the current project folder, folder that's currently open in VS Code.<br><br>|![](https://github.com/user-attachments/assets/dd94002c-2972-413f-8fe6-c013ce36255f)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Create TDML File***||
|Close the DFDL schema in the editor window.  Click the explore tab to verify file is in project folder. <br><br>|![](https://github.com/user-attachments/assets/542b21fa-0397-46d1-b77d-355a8912339b)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Execute TDML File***||
|Open the TDML file. <br><br>|![](https://github.com/user-attachments/assets/e0f769a8-928c-4379-8ec0-3fe818120cf8)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Execute TDML File***||
|After the TDML file opens, select the “Execute TDML” option from the dropdown, or “Execute TDML” in the command view panel, or "Daffodil Debug: Execute TDML" in the command palette.  <br><br>|![](https://github.com/user-attachments/assets/d7fdd956-680c-4507-8064-6ba2061bfd8c)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Execute TDML File***||
|Select the name of the test case to execute. <br><br>|![](https://github.com/user-attachments/assets/8089d244-3953-4e62-9b34-2b46b95b21bc)|

|<div style="width:200px"></div>|<div style="width:205px"></div>|
|:---|:---|
|***Execute TDML File***||
|The DFDL schema and a new infoset will utilize the values from the TDML file.   <br><br>|![](https://github.com/user-attachments/assets/d6dc71df-ae41-47ba-b42b-0e97f42673da)|
