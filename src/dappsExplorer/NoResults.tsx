import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { DappFilter } from 'src/dapps/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  filter: DappFilter | null
  removeFilter: () => void
  testID?: string
}

export function NoResults({ filter, removeFilter, testID }: Props) {
  const { t } = useTranslation()
  const localTestID = testID ? `${testID}/NoResults/RemoveFilter` : `NoResults/RemoveFilter`

  const removePress = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter_remove)
    removeFilter()
  }

  return (
    <View testID={`${testID}/NoResults`} style={styles.noMatchingFavorites}>
      <Text style={styles.noResultsFilterText}>{filter?.name.toLocaleUpperCase()}</Text>
      <Text style={styles.noResultsFilterAppliedText}>
        {t('dappsScreen.emptyResults.filterApplied')}
      </Text>
      <TouchableOpacity
        onPress={removePress}
        style={styles.noResultsRemoveFilterTouchable}
        testID={localTestID}
      >
        <Text style={styles.noResultsRemoveFilterText}>
          {t('dappsScreen.emptyResults.removeFilter')}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  noMatchingFavorites: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.Thick24,
  },
  noResultsFilterText: {
    ...fontStyles.regular500,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.onboardingBlue,
  },
  noResultsFilterAppliedText: {
    ...fontStyles.regular500,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: Colors.gray7,
    paddingHorizontal: 4,
  },
  noResultsRemoveFilterTouchable: {
    paddingVertical: 0,
    paddingHorizontal: 8,
    backgroundColor: Colors.gray2,
    borderRadius: 16,
  },
  noResultsRemoveFilterText: {
    ...fontStyles.regular500,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 20,
    color: Colors.onboardingBlue,
  },
})
