import { SIMPLEX_URI } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'

export const openMoonpay = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CURRENCY_ENUM
) => {
  navigate(Screens.MoonPayScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openSimplex = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CURRENCY_ENUM
) => {
  navigate(Screens.Simplex, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}

export const openRamp = (
  amount: number,
  currencyCode: LocalCurrencyCode,
  currencyToBuy: CURRENCY_ENUM
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
  currencyToBuy: CURRENCY_ENUM
) => {
  navigate(Screens.TransakScreen, {
    localAmount: amount,
    currencyCode,
    currencyToBuy,
  })
}
