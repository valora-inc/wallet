import twilio from 'twilio'
import { sleep } from './utils'

const MAX_TRIES = 180

export const receiveSms = async (after = new Date(), numCodes = 3) => {
  try {
    let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    let tryNumber = 0

    let request = {
      to: `${process.env.VERIFICATION_PHONE_NUMBER.replace(/-/g, ' ')}`,
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
    let client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    const twilioBalance = await client.balance.fetch()
    console.log(`Twilio Balance is ${twilioBalance.balance} ${twilioBalance.currency}`)
    // Convert balance to number and check
    return +twilioBalance.balance > minBalance
  } catch (error) {
    console.log('Error fetching Twilio Credit Balance', error)
  }
}
