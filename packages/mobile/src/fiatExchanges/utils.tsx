import { CurrencyNames, DEFAULT_TESTNET, PROVIDER_URL_COMPOSER, SIMPLEX_URI } from 'src/config'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

interface RequestData {
  address: string | null
  digitalAsset: string
  fiatCurrency: string
  fiatAmount: number
}

export const fetchProviderUrl = async (provider: Providers, requestData: RequestData) => {
  const response = await fetch(PROVIDER_URL_COMPOSER, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...requestData,
      provider,
      env: DEFAULT_TESTNET === 'mainnet' ? 'production' : 'staging',
    }),
  })

  return response.json()
}

export const openMoonpay = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyNames
) => {
  navigate(Screens.MoonPayScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openSimplex = (account: string | null) => {
  navigateToURI(`${SIMPLEX_URI}?address=${account}`)
}

export const openRamp = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyNames
) => {
  navigate(Screens.RampScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openTransak = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CurrencyNames
) => {
  navigate(Screens.TransakScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}
