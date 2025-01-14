#!/bin/bash

yarn concurrently \
  "rimraf dist" \
  "rimraf coverage"
