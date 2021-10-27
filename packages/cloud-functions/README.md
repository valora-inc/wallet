# Cloud Functions

This package contains Cloud Functions that are deployed in Firebase.

Before deploying you need to make sure the `yarn.lock` file is up to date. To do that, you need to put  `"packages/!(cloud-functions)*"` in the `workspaces.packages` section of the root `package.json` temporarily. Once you did that, you can just run `yarn` in this directory to update the `yarn.lock`. Remember to undo the changes in the root `package.json` after doing this!

## Running locally

Since all these functions are expected to run as firebase cloud functions, we don't have a easy way to run them locally, but we can do some hack.
Create a file `local.ts` on the root that is calling the function that you want to run locally and then you can run: `yarn local`.
You might need to download `.runtimeconfig.json`. To do so, you have to:

```bash
#!/bin/bash
firebase login
firebase use alfajores (or firebase use mainnet)
firebase functions:config:get > .runtimeconfig.json
```

## Running tests

`yarn test`
