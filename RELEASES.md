# Release Automation 🤖

This repository contains the configuration that automate nightly and release builds for Valora `mainnet` and `alfajores`.

## Automated Build Types

### Nightly Builds

Nightly builds are run on weekdays daily at 03:00 UTC using GitHub Action's schedule / CRON job feature. This CRON job will setup the environment, compile Valora Nightly for `mainnet` and `alfajores`, and upload them to Google Play and Apple TestFlight. Build status, completion or failure, is then reported in the #eng-release-notifications channel in Slack.

### Release / Production Builds

Release builds are manually triggered using GitHub's `workflow_dispatch` feature. The `workflow_dispatch` takes in an input of "Release Branch Name" which should be the branch that the release manager has created and updated the release version from 1.19.0 to 1.20.0 etc. When triggered, it will setup the environment, compile Valora for `mainnet` and `alfajores` and upload it to Google Play and Apple TestFlight. Build status, completion or failure, is then reported in the #eng-release-notifications channel in Slack.

## How does it know which commit to build?

Release / production builds use the specific branch / commit hash that is provided to the workflow using the `workflow_dispatch` input. The nightly builds on the otherhand use the latest commit on the wallet repo's main branch at the time of the run.

## Why the unix time for version build codes?

Using the unix time from the Git commit allows us to have a specific commit associated to each build we push and it's easy to lookup the commit from that value if needed:

```
git log --format='%H %ct' | grep TIMESTAMP
```
