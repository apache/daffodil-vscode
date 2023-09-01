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

type DescriptionBody = Array<string>

type HelpInformation = {
  title: string
  sectionId: AvailableHelpSections
  descriptionBody: DescriptionBody
}

export const HelpDialogWidth = 300
export const HelpDialogHeight = 350
export const HelpDialogBorderWidth = 2
export const HelpDialogLeftOffset = HelpDialogWidth + HelpDialogBorderWidth
export const HelpDialogTopOffset = HelpDialogHeight + HelpDialogBorderWidth

const EditInstructionsHelp: HelpInformation = {
  title: 'Edit Modes',
  sectionId: 'edit-instructions',
  descriptionBody: [
    '<h3>Multiple Byte Edits</h3>',
    "To edit multiple bytes, highlight, by clicking and dragging over, a selection of bytes in either the physical or logical viewports. This will populate the \
    'Edit' panel with the data to edit.",
    '<h3>Single Byte Edits</h3>',
    'To edit a single byte, simply click any singular byte within either of the viewports. This is replace the content with an input field to perform edits.',
  ],
}

export const AvailableHelpSections = {
  'edit-instructions': EditInstructionsHelp,
}

export type AvailableHelpSections = keyof typeof AvailableHelpSections | ''
