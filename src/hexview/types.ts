import { ViewColumn } from "vscode";

export interface DisplayHtmlRequest {
    title: string;
    position: ViewColumn;
    html: string;
    reveal: boolean;
    bytePos1b: number;
}
