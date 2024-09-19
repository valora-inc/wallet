// Add some app variables to the GITHUB_ENV from a given env name. For example:
// yarn ts-node .github/scripts/setAppEnv.ts "alfajores"

import * as dotenv from 'dotenv'
import { appendFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { config, exec } from 'shelljs'

config.fatal = true
config.verbose = true

// Check if the environment argument is provided
if (process.argv.length < 3) {
  console.error('Error: You must provide an environment name')
  process.exit(1)
}

const envName = process.argv[2]

// Load and export variables from the .env file
const envFilePath = resolve(`.env.${envName}`)
if (!existsSync(envFilePath)) {
  console.error(`Error: Environment file .env.${envName} not found`)
  process.exit(1)
}

dotenv.config({ path: envFilePath })

// Append the necessary variables to GITHUB_ENV
const GITHUB_ENV = process.env.GITHUB_ENV
if (!GITHUB_ENV) {
  console.error('Error: GITHUB_ENV is not set')
  process.exit(1)
}

// Append commit hash to GITHUB_ENV
const commitHash = exec('git rev-parse HEAD', { silent: true }).toString().trim()
appendFileSync(GITHUB_ENV, `APP_COMMIT_HASH=${commitHash}\n`)

// Append commit unix time to GITHUB_ENV
const commitUnixTime = exec('git show -s --format=%ct', { silent: true }).toString().trim()
appendFileSync(GITHUB_ENV, `APP_COMMIT_UNIX_TIME=${commitUnixTime}\n`)

// Append app version to GITHUB_ENV
const version = require(resolve('package.json')).version
appendFileSync(GITHUB_ENV, `APP_VERSION=${version}\n`)

const APP_BUNDLE_ID = process.env.APP_BUNDLE_ID
if (!APP_BUNDLE_ID) {
  console.error('Error: APP_BUNDLE_ID is not set')
  process.exit(1)
}

// Append APP_BUNDLE_ID to GITHUB_ENV
if (APP_BUNDLE_ID) {
  appendFileSync(GITHUB_ENV, `APP_BUNDLE_ID=${APP_BUNDLE_ID}\n`)
}
