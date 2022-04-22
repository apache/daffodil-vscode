/*---------------------------------------------------------------------------------------------
 *  Copyright (c) [2017] [Vincas Stonys].
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface Tag {
  name: string
  start: number
  end: number
}

export interface Match {
  attributeNestingLevel: number
  opening: Tag
  closing: Tag
}

// Opening/Closing is null = unclosed, but processed
export interface PartialMatch {
  attributeNestingLevel: number
  opening?: Partial<Tag> | null
  closing?: Tag | null
}
