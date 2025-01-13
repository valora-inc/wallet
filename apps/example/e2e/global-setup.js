const fs = require('fs-extra')
const { execSync } = require('child_process')
const detox = require('detox')

async function globalSetup() {
  await require('detox/runners/jest/index').globalSetup()

  if (process.env.DETOX_CONFIGURATION?.includes('android')) {
    downloadTestButlerAPK()
  }

  // Inject the e2e env variables
  require('dotenv').config({ path: `${__dirname}/.env` })
}

function downloadTestButlerAPK() {
  const version = '2.2.1'
  const artifactUrl = `https://repo1.maven.org/maven2/com/linkedin/testbutler/test-butler-app/${version}/test-butler-app-${version}.apk`
  const filePath = `./e2e/test-butler-app.apk`

  fs.ensureDirSync('./cache')
  if (!fs.existsSync(filePath)) {
    console.log(`\nDownloading Test-Butler APK v${version}...`)
    execSync(`curl -f -o ${filePath} ${artifactUrl}`)
  }
}

module.exports = globalSetup
