#!/bin/bash

echo Validating types...
yarn type:check

echo Cleanup...
yarn rimraf dist

echo Building Apps...
yarn ncc build src/main.ts -o dist --license LICENSE
