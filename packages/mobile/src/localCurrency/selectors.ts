import { getRegionCode } from '@celo/utils/lib/phoneNumbers'
import BigNumber from 'bignumber.js'
import CountryData from 'country-data'
import { getCurrencies } from 'react-native-localize'
import { createSelector } from 'reselect'
import { e164NumberSelector } from 'src/account/selectors'
import { getExchangeRatePair } from 'src/exchange/selectors'
import {
  LocalCurrencyCode,
  LocalCurrencySymbol,
  LOCAL_CURRENCY_CODES,
} from 'src/localCurrency/consts'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'
import { getRateForMakerToken } from 'src/utils/currencyExchange'

const MIN_UPDATE_INTERVAL = 12 * 3600 * 1000 // 12 hours

function getCountryCurrencies(e164PhoneNumber: string) {
  const regionCode = getRegionCode(e164PhoneNumber)
  const countries = CountryData.lookup.countries({ alpha2: regionCode })
  const country = countries.length > 0 ? countries[0] : undefined

  return country ? country.currencies : []
}

const getDefaultLocalCurrencyCode = createSelector(
  e164NumberSelector,
  (e164PhoneNumber): LocalCurrencyCode => {
    // Note: we initially tried using the device locale for getting the currencies (`RNLocalize.getCurrencies()`)
    // but the problem is some Android versions don't make it possible to select the appropriate language/country
    // from the device settings.
    // So here we use the country of the phone number
    const countryCurrencies = e164PhoneNumber
      ? getCountryCurrencies(e164PhoneNumber)
      : getCurrencies()
    const supportedCurrenciesSet = new Set(LOCAL_CURRENCY_CODES)

    for (const countryCurrency of countryCurrencies) {
      if (supportedCurrenciesSet.has(countryCurrency as LocalCurrencyCode)) {
        return countryCurrency as LocalCurrencyCode
      }
    }

    return LocalCurrencyCode.USD
  }
)

export function getLocalCurrencyCode(state: RootState): LocalCurrencyCode {
  return state.localCurrency.preferredCurrencyCode || getDefaultLocalCurrencyCode(state)
}

export function getLocalCurrencySymbol(state: RootState): LocalCurrencySymbol | null {
  return LocalCurrencySymbol[getLocalCurrencyCode(state)]
}

export function localCurrencyExchangeRateSelector(state: RootState) {
  const { exchangeRate, eurExchangeRate, fetchedCurrencyCode } = state.localCurrency

  const localCurrencyCode = getLocalCurrencyCode(state)
  if (localCurrencyCode !== fetchedCurrencyCode) {
    // This makes sure we don't return stale exchange rate when the currency code changed
    return {}
  }

  const celoToDollarRate = getRateForMakerToken(
    getExchangeRatePair(state),
    Currency.Celo,
    Currency.Dollar
  )

  return {
    [Currency.Celo]: celoToDollarRate.multipliedBy(new BigNumber(exchangeRate ?? '1')),
    [Currency.Dollar]: exchangeRate,
    [Currency.Euro]: eurExchangeRate,
  }
}

export function getLocalCurrencyExchangeRate(state: RootState) {
  const exchangeRates = localCurrencyExchangeRateSelector(state)
  return exchangeRates?.[Currency.Dollar]
}

export function shouldFetchCurrentRate(state: RootState): boolean {
  const { isLoading, lastSuccessfulUpdate } = state.localCurrency

  if (isLoading) {
    return false
  }

  return !lastSuccessfulUpdate || Date.now() - lastSuccessfulUpdate > MIN_UPDATE_INTERVAL
}
