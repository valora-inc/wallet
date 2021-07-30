export const DEFAULT_RECIPIENT_ADDRESS = '0x22c8a9178841ba95a944afd1a1faae517d3f5daa'
export const SAMPLE_BACKUP_KEY =
  'general debate dial flock want basket local machine effort monitor stomach purity attend brand extend salon obscure soul open floor useful like cause exhaust'
export const DEFAULT_PIN = '112233'
export const EXAMPLE_NAME = 'Test Name'

// This is a bit of hack to allow testing without secrets
let usingSecrets = true
try {
  var secretsFile = require('../../secrets.json')
} catch {
  usingSecrets = false
}

// If attempting to test phone verification without decrypt access edit the values below to the one associated with your Twilio account
let phoneNumber = '+1 306-555-5555'
let twilioAccountSID
let twilioAuthToken
let secretsPresent = false

if (usingSecrets) {
  phoneNumber = secretsFile['VERIFICATION_PHONE_NUMBER']
  twilioAccountSID = secretsFile['TWILIO_ACCOUNT_SID']
  twilioAuthToken = secretsFile['TWILIO_AUTH_TOKEN']
  secretsPresent = true
}

export const VERIFICATION_PHONE_NUMBER = phoneNumber
export const TWILIO_ACCOUNT_SID = twilioAccountSID
export const TWILIO_AUTH_TOKEN = twilioAuthToken
export const SECRETS_PRESENT = secretsPresent
