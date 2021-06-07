import * as functions from 'firebase-functions'
import { DigitalAsset, FiatCurrency } from '../config'
import { composeProviderUrl } from './composeProviderUrl'
import { UserLocationData } from './fetchUserLocationData'
import { Moonpay } from './Moonpay'
import { getProviderAvailability } from './providerAvailability'
import { Providers } from './Providers'
import { Simplex, SimplexQuote } from './Simplex'
import { Transak } from './Transak'
import { Xanpool } from './Xanpool'

// Requests made from v1.14.2 and below had a different format for UserLocationData
export interface UserLocationDataDeprecated {
  country: string | null
  state: string | null
  ipAddress: string | null
}

export interface ProviderRequestData {
  userLocation: UserLocationData | UserLocationDataDeprecated
  walletAddress: string
  fiatCurrency: FiatCurrency
  digitalAsset: DigitalAsset
  fiatAmount?: number
  digitalAssetAmount?: number
  txType: 'buy' | 'sell'
}

export enum PaymentMethod {
  Card = 'Card',
  Bank = 'Bank',
}

export interface ProviderQuote {
  paymentMethod: PaymentMethod
  digitalAsset: string
  returnedAmount: number
  fiatFee: number
}

export interface Provider {
  name: Providers
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  url?: string
  logo: string
  quote?: SimplexQuote | ProviderQuote[]
  cashIn: boolean
  cashOut: boolean
}

export const isUserLocationDataDeprecated = (
  locationData: UserLocationData | UserLocationDataDeprecated
): locationData is UserLocationDataDeprecated => 'country' in locationData

export const fetchProviders = functions.https.onRequest(async (request, response) => {
  const requestData: ProviderRequestData = request.body

  const userLocationData: UserLocationData = isUserLocationDataDeprecated(requestData.userLocation)
    ? {
        countryCodeAlpha2: requestData.userLocation.country,
        region: requestData.userLocation.state,
        ipAddress: requestData.userLocation.ipAddress,
      }
    : requestData.userLocation

  const {
    MOONPAY_RESTRICTED,
    SIMPLEX_RESTRICTED,
    RAMP_RESTRICTED,
    TRANSAK_RESTRICTED,
    XANPOOL_RESTRICTED,
  } = getProviderAvailability(userLocationData)

  const [simplexQuote, moonpayQuote, xanpoolQuote, transakQuote] = await Promise.all([
    Simplex.fetchQuote(
      requestData.walletAddress,
      userLocationData.ipAddress,
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount || requestData.digitalAssetAmount,
      !!requestData.fiatAmount
    ),
    Moonpay.fetchQuote(
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount,
      userLocationData.countryCodeAlpha2
    ),
    Xanpool.fetchQuote(
      requestData.txType,
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount,
      userLocationData.countryCodeAlpha2
    ),
    Transak.fetchQuote(
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount,
      userLocationData.countryCodeAlpha2
    ),
  ])

  const providers: Provider[] = [
    {
      name: Providers.Simplex,
      restricted: SIMPLEX_RESTRICTED,
      unavailable: !simplexQuote,
      paymentMethods: [PaymentMethod.Card],
      logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
      quote: simplexQuote,
      cashIn: true,
      cashOut: false,
    },
    {
      name: Providers.Moonpay,
      restricted: MOONPAY_RESTRICTED || !moonpayQuote?.length,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Moonpay, requestData),
      logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
      quote: moonpayQuote,
      cashIn: true,
      cashOut: false,
    },
    {
      name: Providers.Ramp,
      restricted: RAMP_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Ramp, requestData),
      logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
      cashIn: true,
      cashOut: false,
    },
    {
      name: Providers.Xanpool,
      restricted: XANPOOL_RESTRICTED || !xanpoolQuote?.length,
      paymentMethods: [PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Xanpool, requestData),
      logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
      quote: xanpoolQuote,
      cashIn: true,
      cashOut: true,
    },
    {
      name: Providers.Transak,
      restricted: TRANSAK_RESTRICTED || !transakQuote?.length,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Transak, requestData),
      logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
      quote: transakQuote,
      cashIn: true,
      cashOut: false,
    },
  ]

  response.send(JSON.stringify(providers))
})
