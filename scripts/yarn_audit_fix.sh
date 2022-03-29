#!/usr/bin/env bash

npm install --package-lock-only
npm audit fix
rm yarn.lock
yarn import