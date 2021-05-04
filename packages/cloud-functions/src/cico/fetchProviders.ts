import * as functions from 'firebase-functions'
import { DigitalAsset, FiatCurrency } from '../config'
import { composeProviderUrl } from './composeProviderUrls'
import { getProviderAvailability } from './providerAvailability'
import Simplex, { SimplexQuote } from './Simplex'

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

export enum Providers {
  Moonpay = 'Moonpay',
  Ramp = 'Ramp',
  Transak = 'Transak',
  Simplex = 'Simplex',
  Xanpool = 'Xanpool',
}

export enum PaymentMethod {
  Card = 'Card',
  Bank = 'Bank',
}

export interface Provider {
  provider: Providers
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  url?: string
  logo: string
  quote?: SimplexQuote
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

  const [simplexQuote] = await Promise.all([
    Simplex.fetchQuote(
      requestData.walletAddress,
      requestData.userLocation.ipAddress,
      requestData.digitalAsset,
      requestData.fiatCurrency,
      requestData.fiatAmount || requestData.digitalAssetAmount,
      !!requestData.fiatAmount
    ),
  ])

  const providers: Provider[] = [
    {
      provider: Providers.Moonpay,
      restricted: MOONPAY_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Moonpay, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fmoonpay.png?alt=media',
    },
    {
      provider: Providers.Ramp,
      restricted: RAMP_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Ramp, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
    },
    {
      provider: Providers.Xanpool,
      restricted: XANPOOL_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Xanpool, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fxanpool.png?alt=media',
    },
    {
      provider: Providers.Transak,
      restricted: TRANSAK_RESTRICTED,
      paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
      url: composeProviderUrl(Providers.Transak, requestData),
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Ftransak.png?alt=media',
    },
    {
      provider: Providers.Simplex,
      restricted: SIMPLEX_RESTRICTED,
      unavailable: !simplexQuote,
      paymentMethods: [PaymentMethod.Card],
      logo:
        'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Fsimplex.jpg?alt=media',
      quote: simplexQuote,
    },
  ]

  response.send(JSON.stringify(providers))
})
