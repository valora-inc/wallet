import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, VERIFICATION_PHONE_NUMBER } from '@env'
import twilio from 'twilio'
import { sleep } from './utils'

const MAX_TRIES = 120

export const receiveSms = async (
  numCodes = 3,
  secondsAfter = 3 * 60 * 1000,
  existingCodes = []
) => {
  try {
    let client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    let tryNumber = 0

    while (tryNumber < MAX_TRIES) {
      const messages = await client.messages.list({
        to: `${VERIFICATION_PHONE_NUMBER}`,
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
  } catch (error) {
    console.log('Error with Twilio SMS', error)
  }
}

export const checkBalance = async (minBalance = 0.0675) => {
  try {
    let client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    const twilioBalance = await client.balance.fetch()
    console.log(`Twilio Balance is ${twilioBalance.balance} ${twilioBalance.currency}`)
    // Convert balance to number and check
    return +twilioBalance.balance > minBalance
  } catch (error) {
    console.log('Error fetching Twilio Credit Balance', error)
  }
}
