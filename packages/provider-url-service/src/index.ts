import crypto from 'crypto'
import * as functions from 'firebase-functions'
import {
  CASH_IN_SUCCESS_DEEPLINK,
  CASH_IN_SUCCESS_URL,
  MOONPAY_KEYS,
  PROJECT_ID,
  RAMP_KEYS,
  TRANSAK_KEYS,
  VALORA_LOGO_URL,
  WIDGET_URLS,
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

  const env = PROJECT_ID === 'celo-mobile-mainnet' ? 'production' : 'staging'
  console.log(PROJECT_ID)

  let finalUrl

  if (provider === Providers.MOONPAY) {
    finalUrl = `
      ${WIDGET_URLS[env].moonpay}
        ?apiKey=${MOONPAY_KEYS.public_key}
        &currencyCode=${digitalAsset}
        &walletAddress=${address}
        &baseCurrencyCode=${fiatCurrency}
        &baseCurrencyAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
        `.replace(/\s+/g, '')

    const signature = crypto
      .createHmac('sha256', MOONPAY_KEYS.private_key)
      .update(new URL(finalUrl).search)
      .digest('base64')

    finalUrl = `${finalUrl}&signature=${encodeURIComponent(signature)}`
  } else if (provider === Providers.RAMP) {
    finalUrl = `
      ${WIDGET_URLS[env].ramp}
        ?hostApiKey=${RAMP_KEYS.public_key}
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
      ${WIDGET_URLS[env].transak}
        ?apiKey=${TRANSAK_KEYS.public_key}
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
