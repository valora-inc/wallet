import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Touchable from 'src/components/Touchable'
import { currentLanguageSelector } from 'src/i18n/selectors'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { iconHitslop } from 'src/styles/variables'

interface Props {
  filterName?: string
  removeFilter: () => void
  testID: string
}

export function NoResults({ filterName, removeFilter, testID }: Props) {
  const { t } = useTranslation()
  const language = useSelector(currentLanguageSelector)

  const onPress = () => {
    removeFilter()
  }

  return (
    <View testID={`${testID}/NoResults`} style={styles.favoritesContainer}>
      <Text style={styles.filterAppliedText}>
        <Trans
          i18nKey={'dappsScreen.emptyResults.message'}
          tOptions={{ filter: filterName?.toLocaleUpperCase(language ?? 'en-US') }}
        >
          <Text style={styles.filterText} />
        </Trans>
      </Text>
      <View style={styles.removeFilterTouchableContainer}>
        <Touchable
          hitSlop={iconHitslop}
          onPress={onPress}
          style={styles.removeFilterTouchable}
          testID={`${testID}/NoResults/RemoveFilter`}
        >
          <Text style={styles.removeFilterText}>{t('dappsScreen.emptyResults.removeFilter')}</Text>
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  favoritesContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.Thick24,
  },
  filterText: {
    ...fontStyles.small500,
    color: Colors.onboardingBlue,
  },
  filterAppliedText: {
    ...fontStyles.small500,
    color: Colors.gray5,
    paddingHorizontal: 4,
  },
  removeFilterTouchableContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  removeFilterTouchable: {
    paddingVertical: 0,
    paddingHorizontal: Spacing.Smallest8,
    backgroundColor: Colors.gray2,
    borderRadius: 16,
  },
  removeFilterText: {
    ...fontStyles.small500,
    color: Colors.onboardingBlue,
  },
})
