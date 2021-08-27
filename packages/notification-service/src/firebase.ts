import { DataSnapshot } from '@firebase/database-types'
import Analytics from 'analytics-node'
import * as admin from 'firebase-admin'
import i18next from 'i18next'
import { Currencies, MAX_BLOCKS_TO_WAIT } from './blockscout/transfers'
import {
  ENVIRONMENT,
  NOTIFICATIONS_DISABLED,
  NOTIFICATIONS_TTL_MS,
  NotificationTypes,
  SEGMENT_API_KEY,
} from './config'
import { metrics } from './metrics'

const NOTIFICATIONS_TAG = 'NOTIFICATIONS/'

const analytics: Analytics | undefined = SEGMENT_API_KEY
  ? new Analytics(SEGMENT_API_KEY)
  : undefined

let database: admin.database.Database
let registrationsRef: admin.database.Reference
let lastBlockRef: admin.database.Reference
let lastInviteBlockRef: admin.database.Reference

export interface Registrations {
  [address: string]:
    | {
        fcmToken: string
        language?: string
        txHashes?: { [txHash: string]: string | undefined }
      }
    | undefined
    | null
}

let registrations: Registrations = {}
let lastBlockNotified: number = -1
let lastInviteBlockNotified: number = -1

let rewardsSenders: string[] = []
let inviteRewardsSenders: string[] = []

export function _setTestRegistrations(testRegistrations: Registrations) {
  registrations = testRegistrations
}

export function _setRewardsSenders(testRewardsSenders: string[]) {
  rewardsSenders = testRewardsSenders
}

export function _setInviteRewardsSenders(testRewardsSenders: string[]) {
  inviteRewardsSenders = testRewardsSenders
}

function firebaseFetchError(nodeKey: string) {
  return (errorObject: any) => {
    console.error(`${nodeKey} data read failed:`, errorObject.code)
  }
}

export function initializeDb() {
  database = admin.database()
  registrationsRef = database.ref('/registrations')
  lastBlockRef = database.ref('/lastBlockNotified')
  lastInviteBlockRef = database.ref('/lastInviteBlockNotified')

  function addOrUpdateRegistration(snapshot: DataSnapshot) {
    const registration = snapshot?.val() ?? {}
    console.debug('New or updated registration:', snapshot.key, registration)
    if (snapshot.key) {
      registrations[snapshot.key] = registration
    }
  }
  registrationsRef.on('child_added', addOrUpdateRegistration, firebaseFetchError('registration'))
  registrationsRef.on('child_changed', addOrUpdateRegistration, firebaseFetchError('registration'))

  lastBlockRef.on(
    'value',
    (snapshot) => {
      const lastBlock = snapshot?.val() ?? 0
      console.debug('Latest block data updated: ', lastBlock)
      if (lastBlockNotified < 0) {
        // On the transfers file, we query using |lastBlockNotified - MAX_BLOCKS_TO_WAIT|, which would resolve to the current time.
        // This means that any block previous to |lastBlock| which hasn't been notified never will be.
        // If we just set |lastBlockNotified| to |lastBlock| we would risk sending duplicate notifications to all transfers made in
        // the last |MAX_BLOCKS_TO_WAIT| blocks.
        // To make sure all notifications are always sent, we'd have to store processed blocks on Firebase to persist the cache
        // between deploys.
        lastBlockNotified = lastBlock + MAX_BLOCKS_TO_WAIT
      } else if (lastBlock > lastBlockNotified) {
        lastBlockNotified = lastBlock
      }
      metrics.setLastBlockNotified(lastBlockNotified)
    },
    (errorObject: any) => {
      console.error('Latest block data read failed:', errorObject.code)
    }
  )

  lastInviteBlockRef.on(
    'value',
    (snapshot) => {
      const lastBlock = snapshot?.val() ?? 0
      console.debug('Latest invite block updated: ', lastBlock)
      lastInviteBlockNotified = lastBlock
    },
    (errorObject: any) => {
      console.error('Latest invite block read failed:', errorObject.code)
    }
  )

  database.ref('/rewardsSenders').on(
    'value',
    (snapshot) => {
      rewardsSenders = snapshot?.val() ?? []
      console.debug('Rewards senders updated: ', rewardsSenders)
    },
    (errorObject: any) => {
      console.error('Rewards senders data read failed:', errorObject.code)
    }
  )

  database.ref('/inviteRewardAddresses').on('value', (snapshot) => {
    const addresses = snapshot?.val() ?? []
    console.debug(`inviteRewardAddresses fetched: ${addresses}`)
    if (addresses.length) {
      inviteRewardsSenders = addresses
    }
  })
}

export function getTokenFromAddress(address: string) {
  return registrations[address]?.fcmToken ?? null
}

export function getTranslatorForAddress(address: string) {
  const registration = registrations[address]
  const language = registration && registration.language
  // Language is set and i18next has the proper config
  if (language) {
    console.info(`Language resolved as ${language} for user address ${address}`)
    return i18next.getFixedT(language)
  }
  // If language is not supported falls back to env.DEFAULT_LOCALE
  console.info(`Users ${address} language is not set, valid or supported`)
  return i18next.t.bind(i18next)
}

export function getLastBlockNotified() {
  return lastBlockNotified
}

export function getLastInviteBlockNotified() {
  return lastInviteBlockNotified
}

export function setLastBlockNotified(newBlock: number): Promise<void> | undefined {
  if (newBlock <= lastBlockNotified) {
    console.debug('Block number less than latest, skipping latestBlock update.')
    return
  }

  console.debug('Updating last block notified to:', newBlock)
  // Although firebase will keep our local lastBlockNotified in sync with the DB,
  // we set it here ourselves to avoid race condition where we check for notifications
  // again before it syncs
  lastBlockNotified = newBlock
  metrics.setLastBlockNotified(newBlock)
  if (ENVIRONMENT === 'local') {
    return
  }
  return lastBlockRef.set(newBlock)
}

export function setLastInviteBlockNotified(newBlock: number): Promise<void> | undefined {
  if (newBlock <= lastInviteBlockNotified) {
    console.debug('Block number less than latest, skipping latestInviteBlock update.')
    return
  }

  console.debug('Updating last block notified to:', newBlock)
  // Although firebase will keep our local lastBlockNotified in sync with the DB,
  // we set it here ourselves to avoid race condition where we check for notifications
  // again before it syncs
  lastInviteBlockNotified = newBlock
  if (ENVIRONMENT === 'local') {
    return
  }
  return lastInviteBlockRef.set(newBlock)
}

function notificationTitleAndBody(senderAddress: string, currency: Currencies) {
  const isRewardSender = rewardsSenders.includes(senderAddress)
  if (isRewardSender) {
    return {
      title: 'rewardReceivedTitle',
      body: 'rewardReceivedBody',
    }
  }
  const isInvite = inviteRewardsSenders.includes(senderAddress)
  if (isInvite) {
    return {
      title: 'inviteRewardTitle',
      body: 'inviteRewardBody',
    }
  }
  return {
    [Currencies.DOLLAR]: {
      title: 'paymentReceivedTitle',
      body: 'paymentReceivedBody',
    },
    [Currencies.EURO]: {
      title: 'paymentReceivedTitle',
      body: 'paymentReceivedBody',
    },
    [Currencies.GOLD]: {
      title: 'celoReceivedTitle',
      body: 'celoReceivedBody',
    },
  }[currency]
}

export async function sendPaymentNotification(
  senderAddress: string,
  recipientAddress: string,
  amount: string,
  currency: Currencies,
  blockNumber: number,
  data: { [key: string]: string }
) {
  console.info(NOTIFICATIONS_TAG, 'Block delay: ', lastBlockNotified - blockNumber)

  // Set the metric tracking this delay
  metrics.setBlockDelay(lastBlockNotified - blockNumber)

  const t = getTranslatorForAddress(recipientAddress)
  data.type = NotificationTypes.PAYMENT_RECEIVED

  const { title, body } = notificationTitleAndBody(senderAddress, currency)
  return sendNotification(
    t(title),
    t(body, {
      amount,
      currency: t(currency),
    }),
    recipientAddress,
    data
  )
}

export async function sendInviteNotification(inviter: string) {
  const t = getTranslatorForAddress(inviter)
  return sendNotification(t('inviteTitle'), t('inviteBody'), inviter, {
    type: NotificationTypes.INVITE_REDEEMED,
  })
}

export async function sendNotification(
  title: string,
  body: string,
  address: string,
  data: { [key: string]: string }
) {
  const token = getTokenFromAddress(address)
  if (!token) {
    console.info('FCM token missing for address:', address)
    return
  }

  // https://firebase.google.com/docs/cloud-messaging/concept-options#setting-the-priority-of-a-message
  const message: admin.messaging.Message = {
    notification: {
      title,
      body,
    },
    android: {
      ttl: NOTIFICATIONS_TTL_MS,
      priority: 'normal',
      notification: {
        icon: 'ic_stat_rings',
        color: '#42D689',
      },
    },
    data,
    token,
  }

  try {
    const response = await admin.messaging().send(message, NOTIFICATIONS_DISABLED)
    console.info(
      JSON.stringify({
        action: 'NOTIFICATION_SEND_SUCCESS',
        type: data.type,
        title,
        address,
        response,
      })
    )
    analytics?.track({
      anonymousId: 'notification-service',
      event: 'push_notification_sent',
      properties: {
        type: data.type,
        title,
        address,
      },
    })

    // Notification metrics
    metrics.sentNotification(data.type)
    if (data.timestamp) {
      metrics.setNotificationLatency(Date.now() - Number(data.timestamp), data.type)
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        action: 'NOTIFICATION_SEND_FAILURE',
        type: data.type,
        title,
        error,
        address,
      })
    )
    metrics.failedNotification(data.type)
  }
}
