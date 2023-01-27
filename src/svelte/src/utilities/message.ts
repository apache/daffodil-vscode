
export enum MessageCommand {
    commit,
    addBreakpoint,
    editorOnChange,
    loadFile,
    requestEditedData,
    setSessionFile,
    updateLogicalDisplay,
}
export type LogicalDisplayState = {
    bytesPerRow: number
}
export type EditorDisplayState = {
    encoding: BufferEncoding
    start: number
    end: number
    cursor: number
    // radix: number
}
