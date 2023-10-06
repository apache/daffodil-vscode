/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  window,
  Disposable,
  QuickInput,
  QuickInputButtons,
  ExtensionContext,
} from 'vscode'
import { AppConstants } from './utilities/constants'

export async function newTestCaseInput(context: ExtensionContext) {
  interface State {
    title: string
    step: number
    totalSteps: number
    testName: string
    testDesc: string
    testModel: string | string
    dfdlInfoset: string
    dataDocs: string
  }

  async function collectInputs() {
    const state = {} as Partial<State>
    await MultiStepInput.run((input) => inputTestName(input, state))
    return state as State
  }

  const title = AppConstants.addNewTitle

  async function inputTestName(input: MultiStepInput, state: Partial<State>) {
    state.testName = await input.showInputBox({
      title,
      step: 1,
      totalSteps: 5,
      value: state.testName || '',
      prompt: AppConstants.promptTestName,
      validate: validateNotNull,
      shouldResume: shouldResume,
    })
    return (input: MultiStepInput) => inputTestDesc(input, state)
  }

  async function inputTestDesc(input: MultiStepInput, state: Partial<State>) {
    state.testDesc = await input.showInputBox({
      title,
      step: 2,
      totalSteps: 5,
      value: state.testDesc || '',
      prompt: AppConstants.promptTestDescription,
      validate: validateNotNull,
      shouldResume: shouldResume,
    })
    return (input: MultiStepInput) => inputTestModel(input, state)
  }

  async function inputTestModel(input: MultiStepInput, state: Partial<State>) {
    state.testModel = await input.showInputBox({
      title,
      step: 3,
      totalSteps: 5,
      value: state.testModel || '',
      prompt: AppConstants.promptTestModel,
      validate: validateNotNull,
      shouldResume: shouldResume,
    })
    return (input: MultiStepInput) => inputDfdlInfoset(input, state)
  }

  async function inputDfdlInfoset(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    state.dfdlInfoset = await input.showInputBox({
      title,
      step: 4,
      totalSteps: 5,
      value: state.dfdlInfoset || '',
      prompt: AppConstants.promptDfdlInfoset,
      validate: validateNotNull,
      shouldResume: shouldResume,
    })
    return (input: MultiStepInput) => inputDataDocuments(input, state)
  }

  async function inputDataDocuments(
    input: MultiStepInput,
    state: Partial<State>
  ) {
    state.dataDocs = await input.showInputBox({
      title,
      step: 5,
      totalSteps: 5,
      value: state.dataDocs || '',
      prompt: AppConstants.prompDataDocuments,
      validate: validateNotNull,
      shouldResume: shouldResume,
    })
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise<boolean>((resolve, reject) => {
      // noop
    })
  }

  async function validateNotNull(name: string) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return name === '' ? 'Must not be empty' : undefined
  }

  const state = await collectInputs()

  return state
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
  static back = new InputFlowAction()
  static cancel = new InputFlowAction()
  static resume = new InputFlowAction()
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>

interface InputBoxParameters {
  title: string
  step: number
  totalSteps: number
  value: string
  prompt: string
  placeholder?: string
  validate: (value: string) => Promise<string | undefined>
  shouldResume: () => Thenable<boolean>
}

class MultiStepInput {
  static async run<T>(start: InputStep) {
    const input = new MultiStepInput()
    return input.stepThrough(start)
  }

  private current?: QuickInput
  private steps: InputStep[] = []

  private async stepThrough<T>(start: InputStep) {
    let step: InputStep | void = start
    while (step) {
      this.steps.push(step)
      if (this.current) {
        this.current.enabled = false
        this.current.busy = true
      }
      try {
        step = await step(this)
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop()
          step = this.steps.pop()
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop()
        } else if (err === InputFlowAction.cancel) {
          step = undefined
        } else {
          throw err
        }
      }
    }
    if (this.current) {
      this.current.dispose()
    }
  }

  async showInputBox<P extends InputBoxParameters>({
    title,
    step,
    totalSteps,
    value,
    prompt,
    validate,
    shouldResume,
    placeholder,
  }: P) {
    const disposables: Disposable[] = []
    try {
      return await new Promise<
        string | (P extends { buttons: (infer I)[] } ? I : never)
      >((resolve, reject) => {
        const input = window.createInputBox()
        input.title = title
        input.step = step
        input.totalSteps = totalSteps
        input.value = value || ''
        input.prompt = prompt
        input.buttons = [
          ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
        ]
        input.placeholder = placeholder
        let validating = validate('')
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back)
            } else {
              resolve(<any>item)
            }
          }),
          input.onDidAccept(async () => {
            const value = input.value
            input.enabled = false
            input.busy = true
            if (!(await validate(value))) {
              resolve(value)
            }
            input.enabled = true
            input.busy = false
          }),
          input.onDidChangeValue(async (text) => {
            const current = validate(text)
            validating = current
            const validationMessage = await current
            if (current === validating) {
              input.validationMessage = validationMessage
            }
          }),
          input.onDidHide(() => {
            ;(async () => {
              reject(
                shouldResume && (await shouldResume())
                  ? InputFlowAction.resume
                  : InputFlowAction.cancel
              )
            })().catch(reject)
          })
        )
        if (this.current) {
          this.current.dispose()
        }
        this.current = input
        this.current.show()
      })
    } finally {
      disposables.forEach((d) => d.dispose())
    }
  }
}
