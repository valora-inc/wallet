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
const fetch = require('node-fetch')

type Environment = 'production' | 'staging'
interface ProviderUrlRequestData {
  env: Environment
  provider: string
  address: string
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: string
}

interface IpAddressRequestData {
  env: Environment
}

interface IpAddressResponseData {
  alpha2: string
  alpha3: string
  state: string
  ipAddress: string
}

export const composeCicoProviderUrl = functions.https.onRequest((request, response) => {
  const requestData: ProviderUrlRequestData = request.body
  const { provider, env, address, digitalAsset, fiatCurrency, fiatAmount } = requestData
  const providerName = provider.toLowerCase()
  let finalUrl

  if (providerName === 'moonpay') {
    const { widgetUrl, public_key, private_key } = MOONPAY_DATA[env]

    finalUrl = `
      ${widgetUrl}
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
    const { widgetUrl, public_key } = RAMP_DATA[env]

    finalUrl = `
      ${widgetUrl}
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
    const { widgetUrl, public_key } = TRANSAK_DATA[env]

    finalUrl = `
      ${widgetUrl}
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

export const determineIpAddressLocation = functions.https.onRequest(async (request, response) => {
  const requestData: IpAddressRequestData = request.body
  const { apiUrl, public_key } = MOONPAY_DATA[requestData.env]

  const url = `
    ${apiUrl}/v4/ip_address
        ?apiKey=${public_key}
      `.replace(/\s+/g, '')

  const ipAddressFetchResponse = await fetch(url)
  const ipAddressData: IpAddressResponseData = await ipAddressFetchResponse.json()

  response.send(JSON.stringify(ipAddressData))
})
