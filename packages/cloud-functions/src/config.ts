const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

export const MOONPAY_DATA = {
  widget_url: config.moonpay.widget_url,
  public_key: config.moonpay.public_key,
  private_key: config.moonpay.private_key,
}

export const RAMP_DATA = {
  widget_url: config.ramp.widget_url,
  public_key: config.ramp.public_key,
}

export const TRANSAK_DATA = {
  widget_url: config.transak.widget_url,
  public_key: config.transak.public_key,
  private_key: config.transak.private_key,
}

export const MOONPAY_WEBHOOK_KEY = config.moonpay.webhook_key
export const RAMP_KEY = config.ramp.pem_file

export const VALORA_LOGO_URL =
  'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png'

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'

export const CASH_IN_SUCCESS_URL = 'https://valoraapp.com/?done=true'
