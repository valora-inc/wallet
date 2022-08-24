import { createSelector } from 'reselect'
import { countryFeatures } from 'src/flags'
import { RootState } from 'src/redux/reducers'
import useSelector from 'src/redux/useSelector'

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
  (state: RootState) => state.networkInfo.userLocationData,
  ({ countryCodeAlpha2 }) => getCountryFeatures(countryCodeAlpha2)
)

export function useCountryFeatures() {
  return useSelector(getCountryFeaturesSelector)
}
