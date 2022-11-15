import SmsRetriever from '@celo/react-native-sms-retriever'
import { eventChannel } from 'redux-saga'
import { call, put, take } from 'redux-saga/effects'
import { receiveAttestationMessage } from 'src/identity/actions'
import { CodeInputType, NUM_ATTESTATIONS_REQUIRED } from 'src/identity/verification'
import Logger from 'src/utils/Logger'

const TAG = 'identity/smsRetrieval'

export interface SmsEvent {
  error?: string
  timeout?: string
  message?: string
}

export function* startAutoSmsRetrieval() {
  const autoSmsChannel = eventChannel((emitter) => {
    addSmsListener(emitter)
    return removeSmsListener
  })
  // TODO(Rossy) Remove the *2 here once the SmsRetriever can filter dupes on its own
  yield call(startSmsRetriever, NUM_ATTESTATIONS_REQUIRED * 2)
  try {
    const messages: string[] = []
    while (true) {
      const { message } = yield take(autoSmsChannel)
      if (!messages.includes(message)) {
        messages.push(message)
        yield put(receiveAttestationMessage(message, CodeInputType.AUTOMATIC))
      }
    }
  } catch (error) {
    Logger.error(TAG + '@SmsRetriever', 'Error while retrieving code', error)
  } finally {
    autoSmsChannel.close()
  }
}

export async function startSmsRetriever(numMessages = 1) {
  Logger.debug(TAG + '@SmsRetriever', 'Starting sms retriever')
  try {
    const result = await SmsRetriever.startSmsRetriever(numMessages)
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
    SmsRetriever.addSmsListener((event: SmsEvent) => {
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
