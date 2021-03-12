const { BigQuery } = require('@google-cloud/bigquery')
import crypto from 'crypto'
import * as functions from 'firebase-functions'
import {
  CASH_IN_SUCCESS_DEEPLINK,
  CASH_IN_SUCCESS_URL,
  MOONPAY_DATA,
  RAMP_DATA,
  TRANSAK_DATA,
  VALORA_LOGO_URL,
} from './config'
const URL = require('url').URL

interface RequestData {
  provider: Providers
  address: string
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: string
}

enum Providers {
  MOONPAY = 'MOONPAY',
  RAMP = 'RAMP',
  TRANSAK = 'TRANSAK',
  SIMPLEX = 'SIMPLEX',
}

export const composeCicoProviderUrl = functions.https.onRequest((request, response) => {
  const requestData: RequestData = request.body
  const { provider, address, digitalAsset, fiatCurrency, fiatAmount } = requestData

  let finalUrl

  if (provider === Providers.MOONPAY) {
    finalUrl = `
      ${MOONPAY_DATA.widget_url}
        ?apiKey=${MOONPAY_DATA.public_key}
        &currencyCode=${digitalAsset}
        &walletAddress=${address}
        &baseCurrencyCode=${fiatCurrency}
        &baseCurrencyAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
        `.replace(/\s+/g, '')

    const signature = crypto
      .createHmac('sha256', MOONPAY_DATA.private_key)
      .update(new URL(finalUrl).search)
      .digest('base64')

    finalUrl = `${finalUrl}&signature=${encodeURIComponent(signature)}`
  } else if (provider === Providers.RAMP) {
    finalUrl = `
      ${RAMP_DATA.widget_url}
        ?hostApiKey=${RAMP_DATA.public_key}
        &userAddress=${address}
        &swapAsset=${digitalAsset}
        &hostAppName=Valora
        &hostLogoUrl=${VALORA_LOGO_URL}
        &fiatCurrency=${fiatCurrency}
        &fiatValue=${fiatAmount}
        &finalUrl=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
      `.replace(/\s+/g, '')
  } else if (provider === Providers.TRANSAK) {
    finalUrl = `
      ${TRANSAK_DATA.widget_url}
        ?apiKey=${TRANSAK_DATA.public_key}
        &hostURL=${encodeURIComponent('https://www.valoraapp.com')}
        &walletAddress=${address}
        &disableWalletAddressForm=true
        &cryptoCurrencyCode=${digitalAsset}
        &fiatCurrency=${fiatCurrency}
        &defaultFiatAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(CASH_IN_SUCCESS_URL)}
        &hideMenu=true
      `.replace(/\s+/g, '')
  }

  response.send(JSON.stringify(finalUrl))
})

export const queryForUserInitData = functions.https.onRequest(async (request, response) => {
  const projectId = 'celo-testnet-production'
  const dataset = 'mobile_wallet_production'
  const bigQuery = new BigQuery({ projectId: `${projectId}` })

  const { deviceId } = request.body
  console.log(deviceId)

  const [data] = await bigQuery.query(`
    SELECT context_ip, device_info_user_agent, timestamp FROM ${projectId}.${dataset}.app_launched
    WHERE user_address = (
        SELECT user_address
        FROM ${projectId}.${dataset}.app_launched
        WHERE device_info_unique_id= "${deviceId}"
        AND user_address IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT 1
    )
    ORDER BY timestamp ASC
    LIMIT 1
  `)

  const userInitData = {
    ipAddress: '',
    timestamp: '',
    userAgent: '',
  }

  if (data.length) {
    const { context_ip, device_info_user_agent, timestamp } = data[0]
    userInitData.ipAddress = context_ip
    userInitData.timestamp = timestamp
    userInitData.userAgent = device_info_user_agent
  }

  console.log(userInitData)
  response.send(JSON.stringify(userInitData))
})
