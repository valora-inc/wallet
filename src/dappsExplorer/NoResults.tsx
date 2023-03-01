import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { DappFilter } from 'src/dapps/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  filter: DappFilter | null
  removeFilter: () => void
  testID: string
}

export function NoResults({ filter, removeFilter, testID }: Props) {
  const { t } = useTranslation()

  const removePress = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_filter_remove)
    removeFilter()
  }

  return (
    <View testID={`${testID}/NoResults`} style={styles.favorites}>
      <Text style={styles.filterAppliedText}>
        <Trans
          i18nKey={'dappsScreen.emptyResults.message'}
          tOptions={{ filter: filter?.name.toUpperCase() }}
        >
          <Text style={styles.filterText} />
        </Trans>
      </Text>
      <Touchable
        onPress={removePress}
        style={styles.removeFilterTouchable}
        testID={`${testID}/NoResults/RemoveFilter`}
      >
        <Text style={styles.removeFilterText}>{t('dappsScreen.emptyResults.removeFilter')}</Text>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  favorites: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.Thick24,
  },
  filterText: {
    ...fontStyles.regular500,
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '500',
    color: Colors.onboardingBlue,
  },
  filterAppliedText: {
    ...fontStyles.regular500,
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 20,
    color: Colors.dark,
    paddingHorizontal: 4,
  },
  removeFilterTouchable: {
    paddingVertical: 0,
    paddingHorizontal: 8,
    backgroundColor: Colors.gray2,
    borderRadius: 16,
  },
  removeFilterText: {
    ...fontStyles.regular500,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 20,
    color: Colors.onboardingBlue,
  },
})
