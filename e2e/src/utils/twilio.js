import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  VERIFICATION_PHONE_NUMBER,
} from 'react-native-dotenv'
import twilio from 'twilio'
import { sleep } from '../../../src/utils/sleep'

const MAX_TRIES = 180

export const receiveSms = async (after = new Date(), numCodes = 3) => {
  try {
    let client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    let tryNumber = 0

    let request = {
      to: `${VERIFICATION_PHONE_NUMBER.replace(/-/g, ' ')}`,
      limit: 3,
      dateSentAfter: after,
    }
    while (tryNumber < MAX_TRIES) {
      const messages = await client.messages.list(request)
      const codes = messages.map((message) => message.body.split(': ')[1])
      if (codes.length >= numCodes) {
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
