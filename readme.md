![Daffodil Debug](images/daffodil.jpg)

# VS Code Daffodil Debug

This is a VS Code extension which enables the interactive debugging of DFDL schema parsing using [Apache Daffodil](https://daffodil.apache.org/).

## Installation

Until the extension is available in the [VS Code Extension Marketplace](https://marketplace.visualstudio.com/vscode), please download the latest `.vsix` file from the [releases page](https://github.com/jw3/example-daffodil-vscode/releases). Then install it by either:
  * using the "Extensions: Install from VSIX" command from within VS Code (open the Command Palette with Shift-Command-P, then type `vsix` to bring up the command and pointing it at the downloaded `vsix` file); or
  * on the command-line via `code --install-extension <path-to-downloaded-vsix>`.

## Debugging a DFDL schema

### Debug configuration

Debugging a schema needs both the schema to use and a data file to parse. Currently the selection of these two components is quite manual--you need to create a "launch configuration", which is a JSON description of the debugging session.

1. Select `Run -> Open Configurations` from the VS Code menubar. This will load a `launch.json` file into the editor. You may have existing `configurations, or it may be empty.
2. Press `Add Configuration...` and select the `Daffodil Debug - Launch` option. This should add something like the following to the list of `configurations`:

```json
{
  "type": "dfdl",
  "request": "launch",
  "name": "Ask for file name",
  "program": "${workspaceFolder}/${command:AskForProgramName}",
  "stopOnEntry": true
},
```

You'll need to modify this section name your session appropriately, map the `program` element to your schema file, map `data` to the data file you want to parse, and some minor changes that will be addressed in a future release:

```diff
{
  "type": "dfdl",
  "request": "launch",
- "name": "Ask for file name",
+ "name": "DFDL parse: My Data",
- "program": "${workspaceFolder}/${command:AskForProgramName}",
+ "program": "/path/to/my/schema.dfdl.xsd",
+ "data": "/path/to/my/data",
  "stopOnEntry": true
+ ,
+ "debugServer": 4711
},
```

### Launch a debugging session

In this example, you'd see a `DFDL parse: My Data` menu item at the top of the "Run and Debug" pane (Command-Shift-D). Then press the "play" button to start the debugging session.

Once started, the debugger extension will let you choose what version of the Daffodil backend you want to use. Unless you have a good reason, select the latest version from the list. The schema processing will then start.

In the Terminal you'll see log output from the debugger backend:

```
2021-06-23 17:51:12,513 [io-compute-6] INFO  d.d.d.DAPodil - waiting at tcp://0.0.0.0:4711 
2021-06-23 17:51:15,882 [io-compute-3] INFO  d.d.d.DAPodil - connected at tcp://0.0.0.0:4711 
...
```

Your schema file will also be loaded in VS Code and there should be a visible marking at the beginning where the debugger has paused upon entry to the debugging session. You can then control the debugger using the available VS Code debugger controls.

### Other options for launching a debugging session
* Option 1:
  * Open up the schema file you wish to debug
  * From inside the file open the Command Palette (Mac = Command+Shift+P, Windows/Linux = Ctrl+Shift+P)
  * Once the command Palette is opened start typing `Daffodil Debug:`
    * Option 1 = `Daffodil Debug: Debug File` - This will allow for the user to fully step through the schema (WIP), once fully completed will produce a infoset to a file named `SCHEMA-infoset.xml` which it then opened as well.
    * Option 2 = `Daffodil Debug: Run File` - This will just run the schema through producing the infoset to a file named `SCHEMA-infoset.xml`.
* Option 2:
  * Open up the schema file you wish to debug
  * Click the play button in the top right, you will get two options:
    * Option 1 = `Debug File` - This will allow for the user to fully step through the schema (WIP), once fully completed will produce a infoset to a file named `SCHEMA-infoset.xml` which it then opened as well.
    * Option 2 = `Run File` - This will just run the schema through producing the infoset to a file named `SCHEMA-infoset.xml` which it then opened as well.

## Build and Run as a developer 

* Clone the project [https://github.com/jw3/example-daffodil-vscode.git](https://github.com/jw3/example-daffodil-vscode.git)
* Open the project folder in VS Code.
* Run `yarn` to update the local dependencies.
* Press `F5` to build and launch Daffodil Debug in another VS Code window.

## Current status of the plugin

The extension and backend tested against the extensions available at https://github.com/DFDLSchemas

## What data formats work


| Data Format  | Pass/Fail |
|--------------|-----------|
| Syslog       | Pass      |
| vCard        | Pass      |
| BMP          | Pass      |
| CSV          | Pass      |
| NITF         | Pass      |
| shapeFile    | Pass      |
| SWIFT-MT     | N/A       |
| QuasiXML     | Pass      |
| PCAP         | Pass      |
| PNG          | Pass      |
| EDIFACT      | Pass      |
| iCalendar    | Pass      |
| ISO8583      | Pass      |
| mil-std-2045 | Pass      |
| MagVar       | Pass      |
| NACHA        | Pass      |
| IBM4690-TLOG | Pass      |
| JPEG         | Pass      |
| GIF          | Pass      |
| HL7-v2.7     | N/A       |
| HIPAA-5010   | N/A       |
| IPFIX        | Pass      |
| Cobol        | N/A       |
| GeoNames     | Pass      |


## Reference
- https://code.visualstudio.com/docs/extensions/example-debuggers
