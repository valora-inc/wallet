import { CurrencyNames, DEFAULT_TESTNET, SIMPLEX_URI, VALORA_KEY_DISTRIBUTER_URL } from 'src/config'
import { Providers } from 'src/fiatExchanges/ProviderOptionsScreen'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

export const fetchProviderApiKey = async (provider: Providers) => {
  const postRequestObject = createApiKeyPostRequestObj(provider)
  const response = await fetch(VALORA_KEY_DISTRIBUTER_URL, postRequestObject)
  return response.json()
}

const createApiKeyPostRequestObj = (provider: Providers) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    provider,
    env: DEFAULT_TESTNET,
  }),
})

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
