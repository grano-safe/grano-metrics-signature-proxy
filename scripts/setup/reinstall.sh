#!/bin/bash

yarn concurrently "rimraf ./node_modules" "rimraf ./package-lock.json" && yarn
