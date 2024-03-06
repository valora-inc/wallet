import { createSelector } from 'reselect'
import { countryFeatures } from 'src/flags'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { useSelector } from 'src/redux/hooks'

type CountryFeatures = typeof countryFeatures
type SpecificCountryFeatures = { [K in keyof CountryFeatures]: boolean }

type Entries<T> = Array<{ [K in keyof T]: [K, T[K]] }[keyof T]>

export function getCountryFeatures(countryCodeAlpha2: string | null): SpecificCountryFeatures {
  const features = {} as SpecificCountryFeatures
  for (const [key, value] of Object.entries(countryFeatures) as Entries<CountryFeatures>) {
    features[key] = countryCodeAlpha2 ? (value as any)[countryCodeAlpha2] ?? false : false
  }
  return features
}

export const getCountryFeaturesSelector = createSelector(
  userLocationDataSelector,
  ({ countryCodeAlpha2 }) => getCountryFeatures(countryCodeAlpha2)
)

export function useCountryFeatures() {
  return useSelector(getCountryFeaturesSelector)
}

export const userInSanctionedCountrySelector = createSelector(
  userLocationDataSelector,
  ({ countryCodeAlpha2 }) => getCountryFeatures(countryCodeAlpha2 ?? '').SANCTIONED_COUNTRY ?? false
)
