const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

const FIREBASE_CONFIG = process.env.FIREBASE_CONFIG && JSON.parse(process.env.FIREBASE_CONFIG)
export const PROJECT_ID = FIREBASE_CONFIG.projectId

export const MOONPAY_KEYS = {
  public_key: config.moonpay.public_key,
  private_key: config.moonpay.private_key,
}

export const RAMP_KEYS = {
  public_key: config.ramp.public_key,
}

export const TRANSAK_KEYS = {
  public_key: config.transak.public_key,
  private_key: config.transak.private_key,
}

export const WIDGET_URLS = {
  production: {
    moonpay: 'https://buy.moonpay.io/',
    ramp: 'https://buy.ramp.network',
    transak: 'https://global.transak.com',
  },
  staging: {
    moonpay: 'https://buy-staging.moonpay.io/',
    ramp: 'https://ri-widget-staging.firebaseapp.com',
    transak: 'https://staging-global.transak.com',
  },
}

export const VALORA_LOGO_URL =
  'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png'

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'

export const CASH_IN_SUCCESS_URL = 'https://valoraapp.com/?done=true'
