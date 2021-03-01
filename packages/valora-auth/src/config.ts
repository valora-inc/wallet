const functions = require('firebase-functions')
// This allows us to access Cloud Function environment variables
export const config = functions.config()

export const TRANSAK_PRIVATE_KEY_STAGING = config.transak.private_key_staging
export const TRANSAK_PUBLIC_KEY_STAGING = config.transak.public_key_staging
export const TRANSAK_PRIVATE_KEY_PROD = config.transak.private_key_prod
export const TRANSAK_PUBLIC_KEY_PROD = config.transak.public_key_prod

export const RAMP_PUBLIC_KEY_STAGING = config.ramp.public_key_staging
export const RAMP_PUBLIC_KEY_PROD = config.ramp.public_key_prod

export const MOONPAY_PRIVATE_KEY_STAGING = config.moonpay.private_key_staging
export const MOONPAY_PUBLIC_KEY_STAGING = config.moonpay.public_key_staging
export const MOONPAY_PRIVATE_KEY_PROD = config.moonpay.private_key_prod
export const MOONPAY_PUBLIC_KEY_PROD = config.moonpay.public_key_prod
