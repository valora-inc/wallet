const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

export const MOONPAY_URL_STAGING = 'https://buy-staging.moonpay.io/'
export const MOONPAY_SECRET_KEY_STAGING =
  (process.env.MOONPAY_SECRET_KEY_STAGING as string) || config.moonpay.secret_key_staging
export const MOONPAY_PUBLIC_KEY_STAGING =
  (process.env.MOONPAY_PUBLIC_KEY_STAGING as string) || config.moonpay.public_key_staging

export const MOONPAY_URL_PROD = 'https://buy.moonpay.io/'
export const MOONPAY_SECRET_KEY_PROD =
  (process.env.MOONPAY_SECRET_KEY_PROD as string) || config.moonpay.secret_key_prod
export const MOONPAY_PUBLIC_KEY_PROD =
  (process.env.MOONPAY_PUBLIC_KEY_PROD as string) || config.moonpay.public_key_prod

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'
