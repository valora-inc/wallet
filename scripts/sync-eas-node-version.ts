/* eslint-disable no-console */
// This script syncs the Node.js version from package.json engines to eas.json

import fs from 'fs'
import path from 'path'
import packageJson from '../package.json'

interface EasConfig {
  build?: {
    base?: {
      node?: string
    }
  }
}

/**
 * Sync Node.js version from package.json engines to eas.json
 */
function syncEasNodeVersion(): void {
  const easJsonPath = path.join(__dirname, '..', 'eas.json')

  try {
    // Get Node.js version from package.json
    const nodeVersion = packageJson.engines?.node

    if (!nodeVersion) {
      console.error('❌ No Node.js version found in package.json engines field')
      process.exit(1)
    }

    console.log(`📦 Found Node.js version in package.json: ${nodeVersion}`)

    // Read eas.json
    const easConfig: EasConfig = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'))
    const currentEasNodeVersion = easConfig.build?.base?.node

    if (!currentEasNodeVersion) {
      console.error('❌ No Node.js version found in eas.json build.base.node field')
      process.exit(1)
    }

    console.log(`🏗️  Current Node.js version in eas.json: ${currentEasNodeVersion}`)

    // Check if versions match
    if (nodeVersion === currentEasNodeVersion) {
      console.log('✅ Node.js versions are already in sync!')
      return
    }

    // Update eas.json
    if (!easConfig.build) {
      easConfig.build = {}
    }
    if (!easConfig.build.base) {
      easConfig.build.base = {}
    }
    easConfig.build.base.node = nodeVersion

    // Write back to eas.json with proper formatting
    fs.writeFileSync(easJsonPath, JSON.stringify(easConfig, null, 2) + '\n')

    console.log(`🔄 Updated eas.json Node.js version: ${currentEasNodeVersion} → ${nodeVersion}`)
    console.log('✅ Node.js versions are now in sync!')
  } catch (error) {
    console.error('❌ Error syncing Node.js versions:', (error as Error).message)
    process.exit(1)
  }
}

syncEasNodeVersion()
