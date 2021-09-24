# Cloud Functions

This package contains Cloud Functions that are deployed in Firebase.

Before deploying you need to make sure the `yarn.lock` file is up to date. To do that, you need to put  `"packages/!(cloud-functions)*"` in the `workspaces.packages` section of the root `package.json` temporarily. Once you did that, you can just run `yarn` in this directory to update the `yarn.lock`. Remember to undo the changes in the root `package.json` after doing this!
