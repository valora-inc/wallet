import * as functions from 'firebase-functions'
import {
  MOONPAY_PUBLIC_KEY_PROD,
  MOONPAY_PUBLIC_KEY_STAGING,
  RAMP_PUBLIC_KEY_PROD,
  RAMP_PUBLIC_KEY_STAGING,
  TRANSAK_PUBLIC_KEY_PROD,
  TRANSAK_PUBLIC_KEY_STAGING,
} from './config'

export const distributeValoraKeys = functions.https.onRequest((request, response) => {
  const { provider, env } = request.body

  const providerName = provider.toLowerCase()
  const envIsProd = env.toLowerCase() === 'mainnet'
  let apiKey: string = ''

  if (providerName === 'ramp') {
    apiKey = envIsProd ? RAMP_PUBLIC_KEY_PROD : RAMP_PUBLIC_KEY_STAGING
  } else if (providerName === 'transak') {
    apiKey = envIsProd ? TRANSAK_PUBLIC_KEY_PROD : TRANSAK_PUBLIC_KEY_STAGING
  } else if (providerName === 'moonpay') {
    apiKey = envIsProd ? MOONPAY_PUBLIC_KEY_PROD : MOONPAY_PUBLIC_KEY_STAGING
  }

  response.send(apiKey)
})
