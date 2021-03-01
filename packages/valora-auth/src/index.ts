import * as functions from 'firebase-functions'
import {
  MOONPAY_PRIVATE_KEY_PROD,
  MOONPAY_PRIVATE_KEY_STAGING,
  MOONPAY_PUBLIC_KEY_PROD,
  MOONPAY_PUBLIC_KEY_STAGING,
  RAMP_PUBLIC_KEY_PROD,
  RAMP_PUBLIC_KEY_STAGING,
  TRANSAK_PRIVATE_KEY_PROD,
  TRANSAK_PRIVATE_KEY_STAGING,
  TRANSAK_PUBLIC_KEY_PROD,
  TRANSAK_PUBLIC_KEY_STAGING,
} from './config'

export const distributeValoraKeys = functions.https.onRequest((request, response) => {
  const { provider, env } = request.body

  const providerName = provider.toLowerCase()
  const envIsProd = env.toLowerCase() === 'mainnet'
  let keys = { publicKey: '', privateKey: '' }

  if (providerName === 'ramp') {
    envIsProd ? (keys.publicKey = RAMP_PUBLIC_KEY_PROD) : (keys.publicKey = RAMP_PUBLIC_KEY_STAGING)
  } else if (providerName === 'transak') {
    envIsProd
      ? (keys = {
          publicKey: TRANSAK_PUBLIC_KEY_PROD,
          privateKey: TRANSAK_PRIVATE_KEY_PROD,
        })
      : (keys = {
          publicKey: TRANSAK_PUBLIC_KEY_STAGING,
          privateKey: TRANSAK_PRIVATE_KEY_STAGING,
        })
  } else if (providerName === 'moonpay') {
    envIsProd
      ? (keys = {
          publicKey: MOONPAY_PUBLIC_KEY_PROD,
          privateKey: MOONPAY_PRIVATE_KEY_PROD,
        })
      : (keys = {
          publicKey: MOONPAY_PUBLIC_KEY_STAGING,
          privateKey: MOONPAY_PRIVATE_KEY_STAGING,
        })
  }

  response.send(JSON.stringify(keys))
})
