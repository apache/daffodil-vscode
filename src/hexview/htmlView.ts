import * as vscode from "vscode";
import { DisplayHtmlRequest } from "./types";
import * as fs from "fs";
import * as hexy from "hexy";
import XDGAppPaths from 'xdg-app-paths';
const xdgAppPaths = XDGAppPaths({"name": "dapodil"});

export class DebuggerHtmlView {
    context: vscode.ExtensionContext;
    dataFile: string = "";
    hexFile: string = `${xdgAppPaths.data()}/.data-hex`;
    arrowIconFileCreated: boolean = false;
    hexFileOpened: boolean = false;
    workspaceConfUpdated: boolean = false;
    originalSelectionColor: string = "";
    decorator: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
        color: "white",
        gutterIconPath: `${xdgAppPaths.data()}/.arrow.svg`,
        gutterIconSize: 'contain'
    });

    constructor(context: vscode.ExtensionContext) {
        context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(this.onTerminatedDebugSession, this));
        context.subscriptions.push(vscode.debug.onDidReceiveDebugSessionCustomEvent(this.onDebugSessionCustomEvent, this));
        this.context = context;
    }

    // Method for getting the decorator
    getDecorator() {
        this.decorator.dispose(); // needed to reset decorator
        this.decorator = vscode.window.createTextEditorDecorationType({
            color: "white",
            gutterIconPath: `${xdgAppPaths.data()}/.arrow.svg`,
            gutterIconSize: 'contain'
        });
        return this.decorator;
    }

    // Method for deleting files
    deleteFile(fileName) {
        if (fs.existsSync(fileName)) {
            if (fileName === this.hexFile) {
                vscode.window.visibleTextEditors.forEach(editior => {
                    if (editior.document.fileName === this.hexFile) {
                        editior.hide(); // method is deprecated but is only way to close specific editor not just the active one
                    }
                });
            }

            fs.unlink(fileName, function (err) {
                if (err) {
                    vscode.window.showInformationMessage(`error code: ${err.code} - ${err.message}`);
                }
            });
        }
    }

    // Overriden onTerminatedDebugSession method
    onTerminatedDebugSession(session: vscode.DebugSession) {
        if (session.type === 'dfdl') {
            this.deleteFile(this.hexFile);
            this.deleteFile(`${xdgAppPaths.data()}/.dataFile`);
            this.deleteFile(`${xdgAppPaths.data()}/.arrow.svg`);
            this.dataFile = "";
            this.hexFileOpened = false;
            this.updateWorkbenchConfig(true); // reset workbench config
            this.workspaceConfUpdated = false;
            this.originalSelectionColor = "";
            this.arrowIconFileCreated = false;
        }
    }

    // Overriden onDebugSessionCustomEvent method
    onDebugSessionCustomEvent(e: vscode.DebugSessionCustomEvent) {
        if (e.session.type === 'dfdl') {
            if (e.event === 'daffodil.data') {
                this.onDisplayHex(e.session, e.body);
            }
        }
    }

    // Method for retrieving the data file used
    async setDataFile() {
        let config = vscode.workspace.getConfiguration("launch", vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : vscode.Uri.parse(""));
        let values = config.get('configurations', "");

        // If no config exists get the data file path from the .dataFile or prompt user to go to select it via file explorer
        // Else just grab the dataFile path from the config data attribute
        if (values.length === 0) {
            let dataFile = `${xdgAppPaths.data()}/.dataFile`;

            if (fs.existsSync(dataFile)) {
                this.dataFile = fs.readFileSync(dataFile).toString();
            }
            else { // should never be hit but is here as a fail safe
                this.dataFile = await vscode.window.showOpenDialog({
                    canSelectMany: false, openLabel: 'Select',
                    canSelectFiles: true, canSelectFolders: false
                })
                .then(fileUri => {
                    if (fileUri && fileUri[0]) {
                        return fileUri[0].fsPath;
                    }
                    return "";
                });
            }
        }
        else {
            if (values[0]["data"].includes("${workspaceFolder}") && vscode.workspace.workspaceFolders) {
                this.dataFile = `${vscode.workspace.workspaceFolders[0].uri.fsPath}${values[0]["data"].split("${workspaceFolder}")[1]}`;
            }
            else {
                this.dataFile = values[0]["data"];
            }
        }
    }

    // Method to open the hex file via text editor, selecting the line at the current data position
    openHexFile(body: DisplayHtmlRequest, hex: string) {
        let range = new vscode.Range(new vscode.Position(body.bytePos1b-1, 0), new vscode.Position(body.bytePos1b-1, hex.split("\n")[body.bytePos1b-1].length));
        vscode.workspace.openTextDocument(this.hexFile).then(doc => {
            vscode.window.showTextDocument(doc, {
                selection: range,
                viewColumn: vscode.ViewColumn.Beside,
                preserveFocus: true, preview: false
            })
            .then(editor => {
                editor.setDecorations(
                    this.getDecorator(),
                    [range]
                );
            });
        });

        this.hexFileOpened = true;
    }

    // Method for updating the line selected in the hex file using the current data position
    updateSelectedDataPosition(body: DisplayHtmlRequest, hex: string) {
        let hexEditor = vscode.window.activeTextEditor;
        let range = new vscode.Range(new vscode.Position(body.bytePos1b-1, 0), new vscode.Position(body.bytePos1b-1, hex.split("\n")[body.bytePos1b-1].length));

        vscode.window.visibleTextEditors.forEach(editior => {
            if (editior.document.fileName === this.hexFile) {
                hexEditor = editior;
                return;
            }
        });

        if (!hexEditor) {
            return;
        }
        hexEditor.selection = new vscode.Selection(
            new vscode.Position(body.bytePos1b-1, 0),
            new vscode.Position(body.bytePos1b-1, hex.split("\n")[body.bytePos1b-1].length)
        );
        
        hexEditor.setDecorations(this.getDecorator(), [range]);
        hexEditor.revealRange(range);
    }

    // Method to set the selection color to yellow similar to debug selection, 
    // if reset is true the selection color is either removed or set back to its original color
    updateWorkbenchConfig(reset) {
        let config = vscode.workspace.getConfiguration("workbench", vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : vscode.Uri.parse(""));
        let colorCustomizations = JSON.parse(JSON.stringify(config.get('colorCustomizations', "")));

        if (!reset) {
            if ("editor.selectionBackground" in colorCustomizations) {
                this.originalSelectionColor = colorCustomizations["editor.selectionBackground"];
            }
            colorCustomizations["editor.selectionBackground"] = "#FFFF00";
        }
        else {
            if (this.originalSelectionColor !== "") {
                colorCustomizations["editor.selectionBackground"] = this.originalSelectionColor;
            }
            else {
                colorCustomizations = {};
            }
        }
        config.update("colorCustomizations", colorCustomizations);
    }

    // Method to create the svg arrow file
    async createArrowIconFile() {
        await fs.writeFileSync(`${xdgAppPaths.data()}/.arrow.svg`,`<?xml version="1.0" encoding="iso-8859-1"?>
        <!-- Generator: Adobe Illustrator 18.1.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
        <svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
             viewBox="0 0 16.526 16.526" style="enable-background:new 0 0 16.526 16.526; fill: yellow; transform: scale(0.75);" xml:space="preserve">
        <g>
            <path d="M16.343,7.733C15.74,7.13,9.986,1.559,9.986,1.559S9.22,0.788,9.22,1.81s0,2.649,0,2.649
                s-0.445,0-1.123,0c-2.095,0-6.17,0-7.731,0C0.366,4.459,0,4.448,0,4.92c0,0.474,0,5.854,0,6.516c0,0.662,0.438,0.547,0.438,0.547
                c1.603,0,5.545,0,7.714,0c0.758,0,1.251,0,1.251,0s0,2.032,0,2.872s0.731,0.065,0.731,0.065l6.159-6.331
                C16.293,8.59,16.782,8.171,16.343,7.733z"/>
        </g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>`);
    }

    // Method to display the hex of the current data position sent from the debugger
    async onDisplayHex(session: vscode.DebugSession, body: DisplayHtmlRequest) {
        if (!vscode.workspace.workspaceFolders) {
            return;
        }

        if (!this.arrowIconFileCreated) {
            await this.createArrowIconFile();
            this.arrowIconFileCreated = true;
        }

        if (!this.workspaceConfUpdated) {
            this.updateWorkbenchConfig(false);
            this.workspaceConfUpdated = true;
        }

        if (this.dataFile === "") {
            await this.setDataFile();
        }

        let file = fs.readFileSync(this.dataFile);
        let hex = hexy.hexy(file);

        // Create file that holds path to data file used
        if (!fs.existsSync(this.hexFile)) {
            await fs.writeFile(this.hexFile, hex, function(err){
                if (err) {
                    vscode.window.showInformationMessage(`error code: ${err.code} - ${err.message}`);
                }
            });
        }

        // Open up hex document
        if (!this.hexFileOpened) {
            this.openHexFile(body, hex);
        }
        else {
            this.updateSelectedDataPosition(body, hex);
        }
    }
}
