import twilio from 'twilio'
import { sleep } from './utils'
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from './consts'

// If attempting to test phone verification without decrypt access insert your SID and Auth Token for Twilio Below
const accountSid = TWILIO_ACCOUNT_SID || '<Insert Account SID>'
const authToken = TWILIO_AUTH_TOKEN || '<Insert Auth Token>'
let client
try {
  client = twilio(accountSid, authToken)
} catch {}

const MAX_TRIES = 120

export const receiveSms = async (
  numCodes = 3,
  secondsAfter = 3 * 60 * 1000,
  existingCodes = []
) => {
  let tryNumber = 0

  while (tryNumber < MAX_TRIES) {
    const messages = await client.messages.list({
      dateSentAfter: new Date(Date.now() - secondsAfter),
      limit: 3,
    })
    const codes = messages.map((message) => message.body.split(': ')[1])
    console.log('Codes received:', codes)
    if (codes.filter((code) => !existingCodes.includes(code)).length >= numCodes) {
      return codes
    }
    tryNumber += 1
    await sleep(1000)
  }
  return []
}
