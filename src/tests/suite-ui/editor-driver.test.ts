import { expect } from 'chai'
import {
  EditorView,
  ModalDialog,
  TextEditor,
  Workbench,
} from 'vscode-extension-tester'

// Example of handling a modal dialog
describe('Modal Dialog Tests', () => {
  before(async () => {
    // we need to open some modal dialog first, so lets try to close an unsaved file
    // create a new file
    await new EditorView().closeAllEditors()
    await new Workbench().executeCommand('create new file')
    await new Promise((res) => setTimeout(res, 5000))
  })

  after(async () => {
    await new EditorView().closeAllEditors()
  })

  it('writes changes in the editor', async () => {
    // make some changes
    const editor = new TextEditor()
    await editor.typeTextAt(1, 1, 'here is some text')
    await editor.typeTextAt(1, 13, ' more')
    expect(await editor.getText()).to.equal('here is some more text')
  })

  // now we can check what the dialog says
  it('gets the message', async () => {
    // try to close the editor unsaved, which opens a modal dialog
    await new EditorView().closeEditor(await new TextEditor().getTitle())
    await new Promise((res) => setTimeout(res, 5000))
    expect(await new ModalDialog().getMessage()).contains(
      'Do you want to save the changes you made'
    )
  })

  // and the additional details
  it('gets the details', async () => {
    expect(await new ModalDialog().getDetails()).equals(
      `Your changes will be lost if you don't save them.`
    )
  })

  // we can also find and use the buttons on the dialog
  it('uses the buttons', async () => {
    const buttons = await new ModalDialog().getButtons()

    // there should be 3 buttons in this modal dialog
    expect(buttons.length).equals(3)

    // push the 'Don't Save' button by title
    await new ModalDialog().pushButton(`Don't Save`)
  })
})
