#!/bin/bash
yarn install
yarn compile
yarn vscode:prepublish
yarn package
