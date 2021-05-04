const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

export const MOONPAY_DATA = {
  widget_url: config.moonpay.widget_url,
  public_key: config.moonpay.public_key,
  private_key: config.moonpay.private_key,
  webhook_key: config.moonpay.webhook_key,
}

export const RAMP_DATA = {
  widget_url: config.ramp.widget_url,
  public_key: config.ramp.public_key,
  pem_file: config.ramp.pem_file,
  webhook_url: config.ramp.webhook_url,
}

export const TRANSAK_DATA = {
  widget_url: config.transak.widget_url,
  public_key: config.transak.public_key,
  private_key: config.transak.private_key,
}

export const SIMPLEX_DATA = {
  api_url: config.simplex.api_url,
  checkout_url: config.simplex.checkout_url,
  api_key: config.simplex.api_key,
}

export const XANPOOL_DATA = {
  widget_url: config.xanpool.widget_url,
  public_key: config.xanpool.public_key,
  private_key: config.xanpool.private_key,
  supported_currencies: ['IDR', 'VND', 'SGD', 'HKD', 'TBH', 'INR', 'MYR', 'PHP'],
}

export const VALORA_LOGO_URL =
  'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png'

export const CASH_IN_SUCCESS_DEEPLINK = 'celo://wallet/cash-in-success'
export const CASH_IN_FAILURE_DEEPLINK = 'celo://wallet/cash-in-failure'

export const CASH_IN_SUCCESS_URL = 'https://valoraapp.com/?done=true'

export enum FiatCurrency {
  USD = 'USD',
  CAD = 'CAD',
  EUR = 'EUR',
  MXN = 'MXN',
  COP = 'COP',
  PHP = 'PHP',
  LRD = 'LRD',
  SLL = 'SLL',
  KES = 'KES',
  UGX = 'UGX',
  GHS = 'GHS',
  NGN = 'NGN',
  BRL = 'BRL',
  CVE = 'CVE',
  AUD = 'AUD',
}

export enum DigitalAsset {
  CELO = 'CELO',
  CUSD = 'CUSD',
}

export const ASYNC_TIMEOUT = 15000 // 15 seconds
