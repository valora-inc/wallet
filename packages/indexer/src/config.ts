import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export const VERSION = process.env.GAE_VERSION
export const ENVIRONMENT = process.env.ENVIRONMENT
export const PORT = Number(process.env.PORT) || 8080
export const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE
export const INVITES_POLLING_INTERVAL = Number(process.env.INVITES_POLLING_INTERVAL) || 60000
export const ACCOUNTS_POLLING_INTERVAL = Number(process.env.ACCOUNTS_POLLING_INTERVAL) || 60000
export const ATTESTATIONS_POLLING_INTERVAL =
  Number(process.env.ATTESTATIONS_POLLING_INTERVAL) || 60000
export const TRANSFERS_POLLING_INTERVAL = Number(process.env.TRANSFERS_POLLING_INTERVAL) || 5000

export const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL || 'UNDEFINED'
