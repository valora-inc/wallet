import SmsRetriever from 'react-native-sms-retriever'
import Logger from 'src/utils/Logger'

const TAG = 'identity/smsRetrieval'

export interface SmsEvent {
  error?: string
  timeout?: string
  message?: string
}

export async function startSmsRetriever() {
  Logger.debug(TAG + '@SmsRetriever', 'Starting sms retriever')
  try {
    const result = await SmsRetriever.startSmsRetriever()
    if (result) {
      Logger.debug(TAG + '@SmsRetriever', 'Retriever started successfully')
    } else {
      Logger.error(TAG + '@SmsRetriever', 'Start retriever reported failure')
    }
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error starting retriever', error)
  }
}

export function addSmsListener(onSmsRetrieved: (message: SmsEvent) => void) {
  Logger.debug(TAG + '@SmsRetriever', 'Adding sms listener')
  try {
    void SmsRetriever.addSmsListener((event: SmsEvent) => {
      if (!event) {
        Logger.error(TAG + '@SmsRetriever', 'Sms listener event is null')
        return
      }
      if (event.error) {
        Logger.error(TAG + '@SmsRetriever', 'Sms listener error: ' + event.error)
        return
      }
      if (event.timeout) {
        Logger.warn(TAG + '@SmsRetriever', 'Sms listener timed out')
        return
      }
      if (!event.message) {
        Logger.warn(TAG + '@SmsRetriever', 'Sms listener returned empty message')
        return
      }

      Logger.debug(TAG + '@SmsRetriever', 'Message Received from sms listener', event.message)
      onSmsRetrieved(event)
    })
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error adding sms listener', error)
  }
}

export function removeSmsListener() {
  try {
    Logger.debug(TAG + '@SmsRetriever', 'Removing sms listener')
    SmsRetriever.removeSmsListener()
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error removing sms listener', error)
  }
}
