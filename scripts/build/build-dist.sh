#!/bin/bash

echo Validating types...
yarn type:check

echo Cleanup...
yarn rimraf dist

echo Building Apps...
yarn ncc build src/main.ts -o dist --minify --v8-cache --license LICENSE
