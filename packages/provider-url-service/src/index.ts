import crypto from 'crypto'
import * as functions from 'firebase-functions'
import {
  CASH_IN_SUCCESS_DEEPLINK,
  CASH_IN_SUCCESS_URL,
  CurrencyCode,
  LocalCurrencyCode,
  MOONPAY_DATA,
  RAMP_DATA,
  TRANSAK_DATA,
  VALORA_LOGO_URL,
} from './config'
import Simplex, { SimplexPaymentData, SimplexQuote } from './Simplex'
const URL = require('url').URL

interface UrlRequestData {
  provider: Providers
  address: string
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: string
}

enum Providers {
  Moonpay = 'Moonpay',
  Ramp = 'Ramp',
  Simplex = 'Simplex',
  Transak = 'Transak',
}

export const composeCicoProviderUrl = functions.https.onRequest((request, response) => {
  const requestData: UrlRequestData = request.body
  const { provider, address, digitalAsset, fiatCurrency, fiatAmount } = requestData

  let finalUrl

  if (provider === Providers.Moonpay) {
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
  } else if (provider === Providers.Ramp) {
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
  } else if (provider === Providers.Transak) {
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

export interface UserDeviceInfo {
  id: string
  appVersion: string
  userAgent: string
}
interface SimplexQuoteRequest {
  type: 'quote'
  userAddress: string
  currentIpAddress: string
  currencyToBuy: CurrencyCode
  fiatCurrency: LocalCurrencyCode
  amount: number
  amountIsFiat: boolean
}

interface SimplexPaymentRequest {
  type: 'payment'
  userAddress: string
  phoneNumber: string | null
  phoneNumberVerified: boolean
  simplexQuote: SimplexQuote
  currentIpAddress: string
  deviceInfo: UserDeviceInfo
}

export const processSimplexRequest = functions.https.onRequest(async (request, response) => {
  const requestData: SimplexQuoteRequest | SimplexPaymentRequest = request.body
  let responseData: SimplexQuote | SimplexPaymentData | undefined

  if (requestData.type === 'quote') {
    responseData = await Simplex.fetchQuote(
      requestData.userAddress,
      requestData.currentIpAddress,
      requestData.currencyToBuy,
      requestData.fiatCurrency,
      requestData.amount,
      requestData.amountIsFiat
    )
  } else if (requestData.type === 'payment') {
    responseData = await Simplex.fetchPaymentRequest(
      requestData.userAddress,
      requestData.phoneNumber,
      requestData.phoneNumberVerified,
      requestData.simplexQuote,
      requestData.currentIpAddress,
      requestData.deviceInfo
    )
  }

  response.send(JSON.stringify(responseData))
})
