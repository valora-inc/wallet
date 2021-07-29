import * as secretsFile from '../../secrets.json'

export const DEFAULT_RECIPIENT_ADDRESS = '0x22c8a9178841ba95a944afd1a1faae517d3f5daa'
export const SAMPLE_BACKUP_KEY =
  'general debate dial flock want basket local machine effort monitor stomach purity attend brand extend salon obscure soul open floor useful like cause exhaust'
export const DEFAULT_PIN = '112233'
export const EXAMPLE_NAME = 'Test Name'
// If attempting to test phone verification without decrypt edit the sample phone number, +1 306-555-5555, to the one associated with your Twilio account
export const VERIFICATION_PHONE_NUMBER =
  secretsFile['VERIFICATION_PHONE_NUMBER'] || '+1 306-555-5555'
