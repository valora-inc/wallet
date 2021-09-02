import twilio from 'twilio'
import { sleep } from './utils'
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from '@env'

const MAX_TRIES = 120

export const receiveSms = async (
  numCodes = 3,
  secondsAfter = 3 * 60 * 1000,
  existingCodes = []
) => {
  let client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
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

export const checkBalance = async () => {
  try {
    let client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    const twilioBalance = await client.balance.fetch()
    console.log(`Twilio Balance is ${twilioBalance.balance} ${twilioBalance.currency}`)
    // Convert balance to number and check
    if (+twilioBalance.balance > 0.0675) {
      return true
    } else {
      return false
    }
  } catch (error) {
    console.log('Error fetching Twilio Credit Balance', error)
  }
}
