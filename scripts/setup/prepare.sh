#!/bin/bash

node -e "if (process.env.NODE_ENV !== 'production'){process.exit(1)}" || husky install
