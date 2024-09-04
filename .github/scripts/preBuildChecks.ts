import { existsSync } from 'fs'

// Check a specific file has been decrypted, this isn't super robust but is good enough for now
const filePath = 'ios/GoogleService-Info.mainnet.plist'
if (!existsSync(filePath)) {
  console.error('❌ wallet repo secrets were not decrypted successfully, please check permissions')
  process.exit(1)
}

console.log('✅ pre build checks were successful')
