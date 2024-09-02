import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { LocalizedCountry } from 'src/utils/Countries'

interface Props {
  country: LocalizedCountry
  isSelected: boolean
  onSelect: (country: LocalizedCountry) => void
  testID?: string
}

export default function SelectCountryItem({ country, isSelected, onSelect, testID }: Props) {
  function onPress() {
    onSelect(country)
  }

  return (
    <Touchable onPress={onPress} testID={testID}>
      <View style={styles.contentContainer}>
        <Text style={styles.flag} numberOfLines={1}>
          {country.emoji}
        </Text>
        <Text style={styles.name} numberOfLines={1}>
          {country.displayName}
        </Text>
        <Text style={styles.code} numberOfLines={1}>
          {country.countryCallingCode}
        </Text>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    paddingVertical: 14,
  },
  flag: {
    fontSize: 20,
    marginLeft: 4,
    marginRight: 16,
  },
  name: {
    ...typeScale.bodyMedium,
    flex: 1,
    marginRight: 16,
  },
  code: {
    ...typeScale.bodyMedium,
    marginRight: 16,
    color: colors.gray4,
  },
})
