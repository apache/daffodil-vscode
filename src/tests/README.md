<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->

# Testing Checklist

## Requirements

- [ ] install Java 8 or higher
- [ ] supported VSCode version
- [ ] operating system
  - [ ] Windows
    - [ ] x86
  - [ ] Linux
    - [ ] x86
    - [ ] ARM
  - [ ] MacOS
    - [ ] x86
    - [ ] Apple Silicon

## Installation

- [ ] install extension from file (.vsix)
- [ ] install extension from marketplace
- [ ] verify that the extension is installed and activated

## DFDL Debugger

- [ ] open a DFDL file
- [ ] verify source highlighting
- [ ] verify code completion
- [ ] verify breakpoints
- [ ] verify data editor
- [ ] verify InfoSet view
- [ ] verify InfoSet diff
- [ ] verify InfoSet output in supported formats
  - [ ] XML
  - [ ] JSON

## DFDL Intellisense

Instructions for testing dfdl intellisense are in the file DfdlIntellisenseTestingChecklist.md in the same directory as this file

## TDML

- [ ] open a TDML file
- [ ] generate a TDML file from debugging a daffodil schema
- [ ] verify that the generated TDML file contains correct relative paths
- [ ] verify parserTestCase object has name, root, model, description
- [ ] verify that the infoSet and DocumentPart are correct
- [ ] append to a TDML file by debugging a schema and specifying append and the file to append to
- [ ] verify the new parserTestCase that was appended to the file
- [ ] execute a TDML Schema through the debugger
- [ ] verify that output generated matches original input
- [ ] make sure that these work cross-platform

## Data Editor

- [ ] open a file (use small and large files of different types)
  - [ ] verify that the tab is the base name of the file
  - [ ] verify that the full path name is correct (if the file name is too long, there will be a horizontal scroll bar)
  - [ ] verify that the Disk Size and Computed Size match the actual size of the file (hover over the values to see the size in bytes)
  - [ ] verify that the file is loaded in less than 5 seconds regardless of the size of the file
  - [ ] verify that the detected Content Type is correct for the file
  - [ ] verify that the header min/max button shows and hides the header
- [ ] navigation
  - [ ] scroll through the file, using navigation buttons
  - [ ] scroll through the file, using the pseudo scrollbar
  - [ ] scroll through the file, using the mouse wheel
  - [ ] scroll through the file, using keyboard shortcuts (up, down, page up, page down, home, end)
- [ ] display modes
  - [ ] verify changing the address radix (hexadecimal, decimal, and octal) works as expected
  - [ ] verify changing the display radix (hexadecimal, decimal, octal, and binary) works as expected
- [ ] profiler
  - [ ] profile the file using the profile button
  - [ ] verify that the radix used matches the address radix (hexadecimal/hex, decimal/dec, octal/oct)
  - [ ] toggle the overlay (ASCII, None)
  - [ ] toggle the scale (Linear, Logarithmic) and verify that the graph is updated accordingly
  - [ ] hover over values in the graph to see the value and frequency (and ASCII character if in the printable range)
  - [ ] green bars are for frequencies that are 1 standard deviation below the mean
  - [ ] yellow bars are for frequencies that are within 1 standard deviation of the mean
  - [ ] red bars are for frequencies that are 1 standard deviation above the mean
  - [ ] change the start offset (use legal, illegal values, negative values, values that are too large, etc.)
  - [ ] change the end offset (use legal, illegal values, negative values, values that are too large and too small, etc.)
  - [ ] change the length (use legal, illegal values, negative values, values that are too large and too small, etc.), max length is 10 million bytes
  - [ ] click the "Profile as CSV" button to download a CSV file of the profile and verify that it's populated correctly
  - [ ] click somewhere outside of the profiler in the Data Editor tab to close the profiler
- [ ] seek
  - [ ] enter offsets in the seek box and use the Seek button and Enter key to navigate to the offset (use legal, illegal values, negative values, upper case and lower case for hexadecimal values, values in the wrong radix, values that are larger than the file size, etc.)
  - [ ] change the address radix and verify that the seek box is updated accordingly (hexadecimal, decimal, octal)
  - [ ] enter the file size into the seek box and verify that the screen scrolls to the last page
- [ ] search
  - [ ] enter a search term into the search box and use the Search button and Enter key to search for the term (use legal, illegal values with respect to the Edit Encoding)
  - [ ] use terms that appear in the data and a term that does not appear in the data
  - [ ] for Latin-1 and ASCII, try case insensitive searches
  - [ ] verify that the search navigation buttons are enabled/disabled appropriately
  - [ ] verify that the clear 'x' button in the search box clears the search term
  - [ ] verify that the all search navigations buttons work as expected, and the search term is highlighted in the logical and physical views correctly with different display radixes
  - [ ] verify that cancel resets the search and hides the search navigation buttons
- [ ] replace
  - [ ] enter a search term into the search box and a replacement term into the replace box and use the Replace button and Enter key to search for the term (use legal, illegal values with respect to the Edit Encoding)
  - [ ] verify that the search navigation buttons are enabled/disabled appropriately
  - [ ] verify that the navigation buttons work as expected, and the search term is highlighted in the logical and physical views correctly with different display radixes
  - [ ] verify that the current highlighted search term is replaced when the Replace button is clicked and that it moves to the next search term if there is one
  - [ ] verify that the clear 'x' button in the replace box clears the replacement term
  - [ ] try replace with an empty replacement term to verify that the search term is removed from the data when Replace is clicked
  - [ ] verify that cancel resets the replace and hides the replace navigation buttons
  - [ ] verify that Redo, Undo and Revert All buttons work as expected after making replacements and the counts appear correct
- [ ] single byte editing
  - [ ] edit a single byte in the data and verify that the change is reflected in the logical and physical views (use legal, illegal values with respect to the Display Radix)
  - [ ] verify that overwrite, insert backward, insert forward, and delete work as expected when Delete, Insert, and Overwrite Editing Modes are selected in both the Physical and Logical Views
  - [ ] verify that the values are correct in the Data Inspector and the correct offset with respect to the selected Address Radix
  - [ ] change the values from the Data Inspector and verify that the changes are reflected in the Data Inspector and the logical and physical views (use legal, illegal values with respect to the Display Radix)
  - [ ] verify correct values in the Data Inspector when changing the endianness
  - [ ] verify that all the values are editable by clicking on them and that the cursor is placed in the edit box with the current value ready to make changes
  - [ ] verify that if the value is changed to a legal value different than the original value, the value is updated in the logical and physical views
  - [ ] verify that the "X" button in the Data Inspector clears the value and makes no changes to the data
  - [ ] verify that Redo, Undo and Revert All buttons work as expected after making edits and the counts appear correct
  - [ ] change the Editing mode to "Overwrite Only" and verify that the insert and delete buttons are hidden
  - [ ] change the Editing mode to "Delete, Insert, and Overwrite" and verify that the overwrite and delete buttons are available
- [ ] multi-byte editing
  - [ ] click and drag to highlight a range of bytes and verify that the range is highlighted in the logical and physical views and that the Data Inspector now becomes an editable text box
  - [ ] verify that the highlighted data appears in the editable text box and in the correct Edit Encoding
  - [ ] verify that the Selection range and size are correct and that the range matches the selected Address Radix
  - [ ] verify that the highlighted data remains correct when scrolling (if the navigation hasn't been locked)
  - [ ] verify that edits can be made with respect to the selected Edit Encoding (use legal, illegal values with respect to the Edit Encoding)
  - [ ] verify that when a legal change is made that the Commit button is activated
  - [ ] verify that data in the edit box can be selected and copied
  - [ ] verify that data can be pasted in the edit box
  - [ ] verify that when changing the selected data back to the original value that the Commit button is deactivated (there is no change to commit)
  - [ ] verify that when an illegal change is made that the Commit button is deactivated and an appropriate error message is displayed
  - [ ] verify that when the Commit button is clicked that the changes are reflected in the logical and physical views
  - [ ] verify that Redo, Undo and Revert All buttons work as expected after committing changes and the counts appear correct
  - [ ] verify that changes in the length of the data are reflected in the Computed Size (hover over the Computed Size to see the tooltip with the byte size)
  - [ ] verify that clicking the 'X' button in the Edit box clears the selection, hides the Edit box, and displays the Data Inspector
- [ ] server heartbeat information
  - [ ] verify that the port the server is on matches the one configured (9000 is the default port)
  - [ ] verify that the server heartbeat information is displayed in the footer when hovering over the dot
  - [ ] ensure the latency is less than 30ms
  - [ ] open another Data Editor tab on a different file and verify that the Session Count is incremented
  - [ ] attempt to open the same file as one that is being edited and verify that opening the session fails and the Session Count is not incremented, then close this tab
  - [ ] close the other Data Editor tab and verify that the Session Count is decremented
- [ ] screen size
  - [ ] verify that when the screen is is large enough that the buttons have icons and text
  - [ ] verify that when the screen is smaller, that the buttons have icons only, with tooltips
  - [ ] verify that regardless of button size, the case sensitivity "Aa" button in the search box always has a tooltip
  - [ ] click the "Profile" button and verify that the "Profile as CSV" button matches the rest of the buttons
- [ ] saving
  - [ ] verify that the file can be saved and that the changes are reflected in the file
  - [ ] verify that the file can be saved as a different file name and that the changes are reflected in the new file
- [ ] themes
  - [ ] verify that when changing to/from light/dark themes (command palette `Preferences: Toggle between Light/Dark Themes`) data editor is updated with the matching theme and that everything is readable
- [ ] final checks
  - [ ] verify that search works on changed data
  - [ ] profile the changed data to verify that changes made are reflected in the profile
  - [ ] verify that all changes can be undone using the Revert All button
  - [ ] verify that closing the last Data Editor tab shuts down the Ωedit server (check the process table searching for omega)
  - [ ] check the log files for errors (e.g., dataEditor-9000.log and serv-9000.log in the OS-specific log directory for macOS it's ~/Library/Application Support/omega_edit/)

## Packaging

- [ ] verify that the packaging script works on all platforms
- [ ] verify that packages are up-to-date and have no known vulnerabilities

## Documentation

- [ ] version specific documentation is complete and up-to-date (https://github.com/apache/daffodil-vscode/wiki)
