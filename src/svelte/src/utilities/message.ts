
export enum MessageCommand {
    commit,
    addBreakpoint,
    editorOnChange,
    loadFile,
    addressOnChange,
}
export type LogicalDisplayState = {
    bytesPerRow: number
}
export type EditorDisplayState = {
    encoding: BufferEncoding
    start: number
    end: number
    cursor: number
    radix: number
}
