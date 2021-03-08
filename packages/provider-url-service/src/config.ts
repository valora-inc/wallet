const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

const MOONPAY_URL_STAGING = 'https://buy-staging.moonpay.io/'
const MOONPAY_URL_PROD = 'https://buy.moonpay.io/'

const RAMP_URL_STAGING = 'https://ri-widget-staging.firebaseapp.com'
const RAMP_URL_PROD = 'https://buy.ramp.network'

const TRANSAK_URL_STAGING = 'https://staging-global.transak.com'
const TRANSAK_URL_PROD = 'https://global.transak.com'

export const MOONPAY_DATA = {
  staging: {
    widgetUrl: MOONPAY_URL_STAGING,
    public_key: config.moonpay.public_key_staging,
    private_key: config.moonpay.private_key_staging,
  },
  production: {
    widgetUrl: MOONPAY_URL_PROD,
    public_key: config.moonpay.public_key_prod,
    private_key: config.moonpay.private_key_prod,
  },
}

export const RAMP_DATA = {
  staging: {
    widgetUrl: RAMP_URL_STAGING,
    public_key: config.ramp.public_key_staging,
  },
  production: {
    widgetUrl: RAMP_URL_PROD,
    public_key: config.ramp.public_key_prod,
  },
}

export const TRANSAK_DATA = {
  staging: {
    widgetUrl: TRANSAK_URL_STAGING,
    public_key: config.transak.public_key_staging,
    private_key: config.transak.private_key_staging,
  },
  production: {
    widgetUrl: TRANSAK_URL_PROD,
    public_key: config.transak.public_key_prod,
    private_key: config.transak.private_key_prod,
  },
}

export const VALORA_LOGO_URL =
  'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png'

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'

export const CASH_IN_SUCCESS_URL = 'https://valoraapp.com/?done=true'
