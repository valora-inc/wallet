// DEPRECATE CLOUD FUNCTION & DELETE FILE ONCE MAJORITY OF USERS ARE ON VERSION >=1.15.0

import * as functions from 'firebase-functions'
import { DigitalAsset, FiatCurrency } from '../config'
import { Simplex, SimplexPaymentData, SimplexQuote } from './Simplex'
import { UserDeviceInfo } from './utils'

interface SimplexQuoteRequest {
  type: 'quote'
  userAddress: string
  currentIpAddress: string
  currencyToBuy: DigitalAsset
  fiatCurrency: FiatCurrency
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
