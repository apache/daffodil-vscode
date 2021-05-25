#!/bin/bash
yarn install
yarn vscode:prepublish
yarn run vsce package
