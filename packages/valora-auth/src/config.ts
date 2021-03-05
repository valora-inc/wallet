const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

export const MOONPAY_DATA = {
  staging: {
    url: config.moonpay.url_staging,
    public_key: config.moonpay.public_key_staging,
    private_key: config.moonpay.private_key_staging,
  },
  production: {
    url: config.moonpay.url_prod,
    public_key: config.moonpay.public_key_prod,
    private_key: config.moonpay.private_key_prod,
  },
}

export const TRANSAK_DATA = {
  staging: {
    url: config.transak.url_staging,
    public_key: config.transak.public_key_staging,
    private_key: config.transak.private_key_staging,
  },
  production: {
    url: config.transak.url_prod,
    public_key: config.transak.public_key_prod,
    private_key: config.transak.private_key_prod,
  },
}

export const RAMP_DATA = {
  staging: {
    url: config.ramp.url_staging,
    public_key: config.ramp.public_key_staging,
  },
  production: {
    url: config.ramp.url_prod,
    public_key: config.ramp.public_key_prod,
  },
}

export const VALORA_LOGO_URL =
  'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png'

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'

export const CASH_IN_SUCCESS_URL = 'https://valoraapp.com/?done=true'
