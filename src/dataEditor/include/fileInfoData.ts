import { ChangesInfoResponse, FileInfoResponse } from 'ext_types'

export type FileInfoKey = keyof FileInfoResponse | keyof ChangesInfoResponse

export type DataEditorFileInfo = FileInfoResponse & ChangesInfoResponse
export const DefaultFileInfo: DataEditorFileInfo = {
  bom: '',
  changeCount: 0,
  computedFileSize: 0,
  contentType: '',
  filename: '',
  language: '',
  undoCount: 0,
}
