import * as vscode from "vscode";
import * as daf from "../daffodil";
import * as fs from "fs";
import * as hexy from "hexy";
import XDGAppPaths from 'xdg-app-paths';
import { ConfigEvent, DaffodilData } from "../daffodil";
const xdgAppPaths = XDGAppPaths({"name": "dapodil"});

export class DebuggerHexView {
    context: vscode.ExtensionContext;
    dataFile: string = "";
    hexFile: string = vscode.workspace.workspaceFolders ? `${vscode.workspace.workspaceFolders[0].uri.fsPath}/datafile-hex` : `${xdgAppPaths.data()}/datafile-hex`;
    hexString: string = "";
    initialState: boolean = true;
    bytePos1b: number = -1;
    decorator: vscode.TextEditorDecorationType = vscode.window.createTextEditorDecorationType({
    	gutterIconPath: `${xdgAppPaths.data()}/.arrow.svg`,
    	gutterIconSize: 'contain',
    	color: 'black',
    	backgroundColor: 'yellow'
    });

    constructor(context: vscode.ExtensionContext) {
    	context.subscriptions.push(vscode.debug.onDidTerminateDebugSession(this.onTerminatedDebugSession, this));
    	context.subscriptions.push(vscode.debug.onDidReceiveDebugSessionCustomEvent(this.onDebugSessionCustomEvent, this));
    	context.subscriptions.push(vscode.debug.onDidStartDebugSession(this.onDidStartDebugSession, this));
    	context.subscriptions.push(vscode.commands.registerCommand('hexview.display', async () => {
    		await this.openHexFile();
    	}));
    	this.context = context;
    }

    // Method for getting the decorator
    getDecorator(hexLength, dataPositon) {
    	this.decorator.dispose(); // needed to reset decorator

    	if (hexLength !== dataPositon) {
    		this.decorator = vscode.window.createTextEditorDecorationType({
    			gutterIconPath: `${xdgAppPaths.data()}/.arrow.svg`,
    			gutterIconSize: 'contain',
    			color: 'black',
    			backgroundColor: 'yellow'
    		});
    	}
    	return this.decorator;
    }

    // Method for deleting files
    deleteFile(fileName) {
    	if (fs.existsSync(fileName)) {
    		if (fileName === this.hexFile) {
    			this.closeHexFile();
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
    		this.deleteFile(`${xdgAppPaths.data()}/.arrow.svg`);
    		vscode.window.visibleTextEditors.forEach(editior => {
    			if (editior.document.fileName === this.hexFile) {
    				editior.hide(); // method is deprecated but is only way to close specific editor not just the active one
    			}
    		});
    		this.dataFile = "";
    		this.initialState = true;
    		this.bytePos1b = -1;
    	}
    }

    // Overriden onDebugSessionCustomEvent method
    onDebugSessionCustomEvent(e: vscode.DebugSessionCustomEvent) {
    	if (e.session.type === 'dfdl') {
    		switch(e.event) {
    			case daf.configEvent:
    				this.setDataFile(e.body);
    				break;
    			case daf.dataEvent:
    				this.onDisplayHex(e.session, e.body);
    				break;
    		}
    	}
    }

    // Override onDidStartDebugSession method
    onDidStartDebugSession(session: vscode.DebugSession) {
    	// On debug session make sure hex file is deleted and not opened
    	if (session.type === 'dfdl') {
    		this.closeHexFile();
    		this.deleteFile(this.hexFile);
    		this.decorator.dispose();
    	}
    }

    // Method for extracting the data file used
    setDataFile(cfg: ConfigEvent) {
    	this.dataFile = cfg.launchArgs.dataPath;
    }

    // Method for getting the selection range
    getSelectionRange(): [vscode.Range, number] {
    	let lineNum = Math.floor((this.bytePos1b-1) / 16);
    	let paddingForSpaces = this.bytePos1b-1 > 0 ? ((this.bytePos1b - (lineNum * 16)-1)*2) : 0;
    	let paddingForLine = this.bytePos1b - 16 > 0 ? (this.bytePos1b - (lineNum * 16)) : this.bytePos1b;
    	let dataPositon = 9 + paddingForLine + paddingForSpaces;
    	let start = new vscode.Position(lineNum, dataPositon);
    	let end = new vscode.Position(lineNum, dataPositon+2);
    	return [new vscode.Range(start, end), lineNum];
    }

    // Method for updating the line selected in the hex file using the current data position
    updateSelectedDataPosition() {
    	let hexEditor = vscode.window.activeTextEditor;
    	let [range, lineNum] = this.getSelectionRange();
    	let hexLength = this.hexString.split("\n")[lineNum] ? this.hexString.split("\n")[lineNum].length : this.bytePos1b;

    	vscode.window.visibleTextEditors.forEach(editior => {
    		if (editior.document.fileName === this.hexFile) {
    			hexEditor = editior;
    			return;
    		}
    	});

    	if (!hexEditor) {
    		return;
    	}
    	hexEditor.selection = new vscode.Selection(range.start, range.end);
    	hexEditor.setDecorations(this.getDecorator(hexLength, this.bytePos1b), [range]);
    	hexEditor.revealRange(range);
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

    // Method to close hexFile if opened in editor
    closeHexFile() {
    	vscode.window.visibleTextEditors.forEach(editior => {
    		if (editior.document.fileName === this.hexFile) {
    			editior.hide();
    		}
    	});
    }

    // Method to open the hex file via text editor, selecting the line at the current data position
    openHexFile() {
    	let [range, _] = this.getSelectionRange();
    	let hexLength = this.hexString.split("\n")[this.bytePos1b-1] ? this.hexString.split("\n")[this.bytePos1b-1].length : this.bytePos1b;
    	vscode.workspace.openTextDocument(this.hexFile).then(doc => {
    		vscode.window.showTextDocument(doc, {
    			selection: range,
    			viewColumn: vscode.ViewColumn.Three,
    			preserveFocus: true, preview: false
    		})
    			.then(editor => {
    				editor.setDecorations(
    					this.getDecorator(hexLength, this.bytePos1b),
    					[range]
    				);
    			});
    	});
    }

    // Method to see hexFile is opened
    checkIfHexFileOpened() {
    	let result = false;
    	vscode.window.visibleTextEditors.forEach(editior => {
    		if (editior.document.fileName === this.hexFile) {
    			result = true;
    		}
    	});
    	return result;
    }

    // Method to display the hex of the current data position sent from the debugger
    async onDisplayHex(session: vscode.DebugSession, body: DaffodilData) {
    	if (!vscode.workspace.workspaceFolders) {
    		return;
    	}
        
    	this.bytePos1b = body.bytePos1b;

    	let file = fs.readFileSync(this.dataFile);
    	let hex = hexy.hexy(file);
    	let hexLines = hex.split("\n");

    	// Format hex code to make the file look nicer
    	hexLines.forEach(h => {
    		if (h) {
    			let splitHex = h.split(":");
    			let dataLocations = splitHex[1].split(" ");

    			this.hexString += splitHex[0] + ": ";
    			for(var i = 1; i < dataLocations.length-2; i++) {
    				let middle = Math.floor(dataLocations[i].length/2);
    				this.hexString += dataLocations[i].substr(0, middle).toUpperCase() + " " + dataLocations[i].substr(middle).toUpperCase() + " ";
    			}
    			this.hexString += "\t" + dataLocations[dataLocations.length-1] + "\n";
    		}
    	});

    	// Create file that holds path to data file used
    	if (!fs.existsSync(this.hexFile)) {
    		await fs.writeFile(this.hexFile, this.hexString, function(err){
    			if (err) {
    				vscode.window.showInformationMessage(`error code: ${err.code} - ${err.message}`);
    			}
    		});
    	}

    	// Create arrow file and open up hex document only on start of debug
    	if (this.initialState) {
    		await this.createArrowIconFile();
    		this.initialState = false;
    	}

    	// Only update position if hex file is opened
    	if (this.checkIfHexFileOpened()) {
    		this.updateSelectedDataPosition();
    	}

    	let hexLength = this.hexString.split("\n")[this.bytePos1b-1] ? this.hexString.split("\n")[this.bytePos1b-1].length : 0;
    	if (hexLength === 0) {
    		this.closeHexFile();
    	}
    }
}
