import * as admin from 'firebase-admin'
import i18next, { TFunction } from 'i18next'
import { NOTIFICATIONS_TTL_MS } from '../config'
import { database, messaging } from '../firebase'
import ValoraAnalytics from '@celo/mobile/src/analytics/ValoraAnalytics'
import { AppEvents } from '@celo/mobile/src/analytics/Events'

const TAG = 'Notifications'

export async function getTranslatorForAddress(address: string): Promise<TFunction> {
  return new Promise((resolve, reject) => {
    database()
      .ref(`registrations/${address}/language`)
      .once('value', (snapshot) => {
        const language = snapshot.val()
        if (language) {
          resolve(i18next.getFixedT(language))
        } else {
          resolve(i18next.t.bind(i18next))
        }
      })
      .catch(reject)
  })
}

export async function getTokenFromAddress(address: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    database()
      .ref(`registrations/${address}/fcmToken`)
      .once('value', (snapshot) => {
        const token = snapshot.val()
        resolve(token)
      })
      .catch(reject)
  })
}

export async function sendNotification(
  title: string,
  body: string,
  address: string,
  data: { [key: string]: string }
) {
  const token = await getTokenFromAddress(address)
  if (!token) {
    console.info(TAG, 'FCM token missing for address:', address)
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
    // TODO: Use a logger that abstracts the json stringifying thing.
    console.info(
      JSON.stringify({
        context: 'Sending Notification',
        type: data.type,
        recipient: address,
      })
    )
    const response = await messaging().send(message)
    console.info(
      JSON.stringify({
        context: 'Notification Sent Successfully',
        type: data.type,
        recipient: address,
        response,
        latency: data.timestamp ? Date.now() - Number(data.timestamp) : null,
      })
    )
    ValoraAnalytics.track(AppEvents.push_notification_opened, {
      id: data.id,
      type: data.type,
    })
  } catch (error) {
    console.error(
      JSON.stringify({
        context: 'Notification Send Failed',
        type: data.type,
        recipient: address,
        error,
        latency: data.timestamp ? Date.now() - Number(data.timestamp) : null,
      })
    )
  }
}
