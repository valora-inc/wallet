#!/usr/bin/env bash

#####
# Test android app with doze mode
# https://medium.com/@mohitgupta92/testing-your-app-on-doze-mode-4ee30ad6a3b0
#####

# NOTE: make sure the device or emulator screen is turned off, otherwise
# doze does not kick off.

adb shell dumpsys battery unplug

# TODO: we need to run this command multiple times as it cycles through the states:
# Deep: ACTIVE -> IDLE_PENDING -> SENSING -> LOCATING -> IDLE -> IDLE_MAINTENANCE
# IDLE is the "deepest" sleep state meaning no normal pushes should arrive and no
# code can run

adb shell dumpsys deviceidle step deep
