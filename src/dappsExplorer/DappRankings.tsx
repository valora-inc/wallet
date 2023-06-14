import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import { mostPopularDappsSelector } from 'src/dapps/selectors'
import Trophy from 'src/icons/Trophy'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function DappRankings() {
  const { t } = useTranslation()

  const { dappRankingsEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.DAPP_RANKINGS]
  )

  const mostPopularDapps = useSelector(mostPopularDappsSelector)

  const handleShowRankings = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_rankings_open)
  }

  if (!dappRankingsEnabled || mostPopularDapps.length === 0) {
    return null
  }

  return (
    <Touchable style={styles.pressableCard} onPress={handleShowRankings} testID="DappRankings">
      <View style={styles.container}>
        <Trophy />
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{t('dappRankings.title')}</Text>
          <Text style={styles.subtitle}>{t('dappRankings.description')}</Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    marginLeft: Spacing.Small12,
  },
  pressableCard: {
    padding: Spacing.Regular16,
    borderRadius: 8,
    marginTop: Spacing.Smallest8,
    marginBottom: Spacing.Thick24,
    borderWidth: 1,
    borderColor: Colors.gray2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.regular600,
    marginBotton: 4,
  },
  subtitle: {
    ...fontStyles.xsmall,
    color: Colors.gray4,
  },
})

export default DappRankings
