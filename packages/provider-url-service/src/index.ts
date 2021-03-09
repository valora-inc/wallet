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

type Environments = 'production' | 'staging'
interface IpRequestData {
  urlType: 'ip'
  env: Environments
}
interface WidgetRequestData {
  urlType: 'widget'
  provider: string
  env: Environments
  address: string
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: string
}

type RequestData = IpRequestData | WidgetRequestData

export const composeCicoProviderUrl = functions.https.onRequest((request, response) => {
  const requestData: RequestData = request.body

  let url
  if (requestData.urlType === 'widget') {
    url = composeWidgetUrl(requestData)
  } else if (requestData.urlType === 'ip') {
    url = composeIpUrl(requestData)
  }

  response.send(JSON.stringify(url))
})

const composeWidgetUrl = (requestData: WidgetRequestData) => {
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

  return finalUrl
}

const composeIpUrl = (requestData: IpRequestData) => {
  const { apiUrl, public_key } = MOONPAY_DATA[requestData.env]

  const url = `
    ${apiUrl}/v4/ip_address
        ?apiKey=${public_key}
      `.replace(/\s+/g, '')

  return url
}
