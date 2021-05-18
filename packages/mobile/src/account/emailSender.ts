import { openComposer } from 'react-native-email-link'
import * as RNFS from 'react-native-fs'
import Mailer from 'react-native-mail'
import { CELO_SUPPORT_EMAIL_ADDRESS } from 'src/config'
import Logger from 'src/utils/Logger'

export interface Email {
  subject: string
  recipients: [string]
  body: string
  isHTML: boolean
  attachments?: Array<{
    path: string
    type: string
    name: string
  }>
}

export async function sendEmailWithNonNativeApp(
  emailSubect: string,
  message: string,
  deviceInfo?: {},
  combinedLogsPath?: string | false
) {
  try {
    const supportLogsMessage = combinedLogsPath
      ? `Support logs: ${!combinedLogsPath || (await RNFS.readFile(combinedLogsPath))}`
      : ''
    await openComposer({
      to: CELO_SUPPORT_EMAIL_ADDRESS,
      subject: emailSubect,
      body: `${message}\n${deviceInfo ? JSON.stringify(deviceInfo) : ''}\n${supportLogsMessage}`,
    })
    return { success: true }
  } catch (error) {
    return { error }
  }
}

export async function sendEmail(
  email: Email,
  deviceInfo?: {},
  combinedLogsPath: string | false = false
) {
  return new Promise<void>((resolve, reject) => {
    // Try to send with native mail app with logs as attachment
    // if fails user can choose mail app but logs sent in message
    Mailer.mail(email, async (error: any, event: string) => {
      if (event === 'sent') {
        resolve()
      } else if (error) {
        const emailSent = await sendEmailWithNonNativeApp(
          email.subject,
          email.body,
          deviceInfo,
          combinedLogsPath
        )
        if (emailSent.success) {
          resolve()
        } else {
          Logger.showError(error + ' ' + emailSent.error)
          reject()
        }
      }
    })
  })
}
