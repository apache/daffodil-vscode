![Daffodil Debug](images/daffodil.jpg)

# VS Code Daffodil Debug

This is an example extension for VS Code using the DAPodil debugging backend which enables intereactive debugging of Daffodil DFDL schema parsing.

## Install and Run

* Download the latest `.vsix` file from the [releases page](https://github.com/jw3/example-daffodil-vscode/releases).
* Install it:
  * using the "Extensions: Install from VSIX" command from within VS Code (open the Command Palette with Shift-Command-P, then type `vsix` to bring up the command); or
  * on the command-line via `code --install-extension <path-to-vsix>`.
* Debugging a schema:
  * TODO

## Build and Run as a developer 

* Clone the project [https://github.com/jw3/example-daffodil-vscode.git](https://github.com/jw3/example-daffodil-vscode.git)
* Open the project folder in VS Code.
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
