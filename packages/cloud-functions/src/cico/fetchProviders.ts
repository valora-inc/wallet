import * as functions from 'firebase-functions'
import { DigitalAsset, FiatCurrency } from '../config'
import { composeProviderUrl } from './composeProviderUrl'
import Moonpay from './Moonpay'
import { getProviderAvailability } from './providerAvailability'
import { Providers } from './Providers'
import Simplex from './Simplex'
import Transak from './Transak'
import Xanpool from './Xanpool'

export interface UserLocationData {
  country: string | null
  state: string | null
  ipAddress: string | null
}

export interface ProviderRequestData {
  userLocation: UserLocationData
  walletAddress: string
  fiatCurrency: FiatCurrency
  digitalAsset: DigitalAsset
  fiatAmount?: number
  digitalAssetAmount?: number
}

export enum PaymentMethod {
  Card = 'Card',
  Bank = 'Bank',
}

export interface ProviderQuote {
  quoteId?: string
  userId?: string
  walletId?: string
  paymentMethod: PaymentMethod
  digitalAsset: string
  digitalAssetsAmount: number
  fiatCurrency: string
  fiatFee: number
}

export interface Provider {
  name: Providers
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  url?: string
  logo: string
  quote?: ProviderQuote[]
  cashIn: boolean
  cashOut: boolean
}

export const fetchProviders = functions.https.onRequest(async (request, response) => {
  const requestData: ProviderRequestData = request.body

  const {
    MOONPAY_RESTRICTED,
    SIMPLEX_RESTRICTED,
    RAMP_RESTRICTED,
    TRANSAK_RESTRICTED,
    XANPOOL_RESTRICTED,
  } = getProviderAvailability(requestData.userLocation)

  const [simplexQuote, moonpayQuote, xanpoolQuote, transakQuote] = await Promise.all([
    Simplex.fetchQuote(
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount || requestData.digitalAssetAmount,
      !!requestData.fiatAmount,
      requestData.walletAddress,
      requestData.userLocation,
      SIMPLEX_RESTRICTED
    ),
    Moonpay.fetchQuote(
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount,
      requestData.userLocation,
      MOONPAY_RESTRICTED
    ),
    Xanpool.fetchQuote(
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount,
      requestData.userLocation,
      XANPOOL_RESTRICTED
    ),
    Transak.fetchQuote(
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount,
      requestData.userLocation,
      TRANSAK_RESTRICTED
    ),
  ])

  const providers: Provider[] = [
    {
      name: Providers.Simplex,
      restricted: SIMPLEX_RESTRICTED,
      unavailable: !simplexQuote,
      paymentMethods: [PaymentMethod.Card],
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
      quote: simplexQuote,
      cashIn: true,
      cashOut: false,
    },
    {
      name: Providers.Moonpay,
      restricted: MOONPAY_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Moonpay, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
      quote: moonpayQuote,
      cashIn: true,
      cashOut: false,
    },
    {
      name: Providers.Ramp,
      restricted: RAMP_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Ramp, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
      cashIn: true,
      cashOut: false,
    },
    {
      name: Providers.Xanpool,
      restricted: XANPOOL_RESTRICTED,
      paymentMethods: [PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Xanpool, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
      quote: xanpoolQuote,
      cashIn: true,
      cashOut: true,
    },
    {
      name: Providers.Transak,
      restricted: TRANSAK_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Transak, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
      quote: transakQuote,
      cashIn: true,
      cashOut: false,
    },
  ]

  response.send(JSON.stringify(providers))
})
