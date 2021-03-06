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
  provider: string
  env: 'production' | 'staging'
  address: string
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: string
}

export const composeCicoProviderUrl = functions.https.onRequest((request, response) => {
  const requestData: RequestData = request.body
  const { provider, env, address, digitalAsset, fiatCurrency, fiatAmount } = requestData

  const providerName = provider.toLowerCase()

  let finalUrl

  if (providerName === 'moonpay') {
    const { url, public_key, private_key } = MOONPAY_DATA[env]

    finalUrl = `
      ${url}
        ?apiKey=${public_key}
        &currencyCode=${digitalAsset}
        &walletAddress=${address}
        &baseCurrencyCode=${fiatCurrency}
        &baseCurrencyAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
        `.replace(/\s+/g, '')

    const signature = crypto
      .createHmac('sha256', private_key)
      .update(new URL(finalUrl).search)
      .digest('base64')

    finalUrl = `${finalUrl}&signature=${encodeURIComponent(signature)}`
  } else if (providerName === 'ramp') {
    const { url, public_key } = RAMP_DATA[env]

    finalUrl = `
      ${url}
        ?hostApiKey=${public_key}
        &userAddress=${address}
        &swapAsset=${digitalAsset}
        &hostAppName=Valora
        &hostLogoUrl=${VALORA_LOGO_URL}
        &fiatCurrency=${fiatCurrency}
        &fiatValue=${fiatAmount}
        &finalUrl=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
      `.replace(/\s+/g, '')
  } else if (providerName === 'transak') {
    const { url, public_key } = TRANSAK_DATA[env]

    finalUrl = `
      ${url}
        ?apiKey=${public_key}
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
