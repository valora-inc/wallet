import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import SearchInput from 'src/components/SearchInput'
import i18n from 'src/i18n'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import SelectCountryItem from 'src/onboarding/registration/SelectCountryItem'
import colors from 'src/styles/colors'
import { LocalizedCountry } from 'src/utils/Countries'
import { getCountryFeatures } from 'src/utils/countryFeatures'

const keyExtractor = (item: LocalizedCountry) => item.alpha2

type Props = NativeStackScreenProps<StackParamList, Screens.SelectCountry>

export default function SelectCountry({ route }: Props) {
  const { countries, selectedCountryCodeAlpha2, onSelectCountry } = route.params
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')

  const filteredCountries = useMemo(
    () =>
      countries
        .getFilteredCountries(searchText)
        .filter((country) => !getCountryFeatures(country.alpha2).SANCTIONED_COUNTRY),
    [countries, searchText]
  )

  function onSelect(country: LocalizedCountry) {
    onSelectCountry(country.alpha2)
  }

  const renderItem = useCallback(
    ({ item: country }: { item: LocalizedCountry }) => (
      <SelectCountryItem
        country={country}
        onSelect={onSelect}
        isSelected={country.alpha2 === selectedCountryCodeAlpha2}
        testID={`Country_${country.alpha2}`}
      />
    ),
    [selectedCountryCodeAlpha2]
  )

  const inset = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <SearchInput
          placeholder={t('search') ?? undefined}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
      <FlatList
        contentContainerStyle={{ paddingBottom: inset.bottom }}
        keyboardShouldPersistTaps={true}
        style={styles.container}
        data={filteredCountries}
        extraData={selectedCountryCodeAlpha2}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
      <KeyboardSpacer />
    </View>
  )
}

SelectCountry.navigationOptions = () => ({
  ...headerWithCloseButton,
  headerTitle: i18n.t('selectCountryCode'),
  headerTransparent: false,
})

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
  },
})
