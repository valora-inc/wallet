import crypto from 'crypto'
import * as functions from 'firebase-functions'
import {
  CASH_IN_SUCCESS_DEEPLINK,
  CASH_IN_SUCCESS_URL,
  MOONPAY_DATA,
  RAMP_DATA,
  TRANSAK_DATA,
  VALORA_LOGO_URL,
  XANPOOL_DATA,
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
  Moonpay = 'Moonpay',
  Ramp = 'Ramp',
  Transak = 'Transak',
  Simplex = 'Simplex',
  Xanpool = 'Xanpool',
}

export const composeCicoProviderUrl = functions.https.onRequest((request, response) => {
  const requestData: RequestData = request.body
  const { provider, address, digitalAsset, fiatCurrency, fiatAmount } = requestData
  const providerName = provider.toLowerCase()
  const cashInSuccessDeepLink = `${CASH_IN_SUCCESS_DEEPLINK}/${providerName}`

  let finalUrl

  if (providerName === Providers.Moonpay.toLowerCase()) {
    finalUrl = `
      ${MOONPAY_DATA.widget_url}
        ?apiKey=${MOONPAY_DATA.public_key}
        &currencyCode=${digitalAsset}
        &walletAddress=${address}
        &baseCurrencyCode=${fiatCurrency}
        &baseCurrencyAmount=${fiatAmount}
        &redirectURL=${encodeURIComponent(cashInSuccessDeepLink)}
        `.replace(/\s+/g, '')

    const signature = crypto
      .createHmac('sha256', MOONPAY_DATA.private_key)
      .update(new URL(finalUrl).search)
      .digest('base64')

    finalUrl = `${finalUrl}&signature=${encodeURIComponent(signature)}`
  } else if (providerName === Providers.Ramp.toLowerCase()) {
    finalUrl = `
      ${RAMP_DATA.widget_url}
        ?hostApiKey=${RAMP_DATA.public_key}
        &userAddress=${address}
        &swapAsset=${digitalAsset}
        &hostAppName=Valora
        &hostLogoUrl=${VALORA_LOGO_URL}
        &fiatCurrency=${fiatCurrency}
        &fiatValue=${fiatAmount}
        &finalUrl=${encodeURIComponent(cashInSuccessDeepLink)}
      `.replace(/\s+/g, '')
  } else if (providerName === Providers.Transak.toLowerCase()) {
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
  } else if (providerName === Providers.Xanpool.toLowerCase()) {
    const supportedCurrencies = ['IDR', 'VND', 'SGD', 'HKD', 'TBH', 'INR', 'MYR', 'PHP']

    finalUrl = `
      ${XANPOOL_DATA.widget_url}
        ?apiKey=${XANPOOL_DATA.public_key}
        &wallet=${address}
        &cryptoCurrency=${digitalAsset}
        ${supportedCurrencies.includes(fiatCurrency) ? `&currency=${fiatCurrency}` : ''}
        &fiat=${fiatAmount}
        &redirectUrl=${CASH_IN_SUCCESS_DEEPLINK}
      `.replace(/\s+/g, '')
  }

  response.send(JSON.stringify(finalUrl))
})
