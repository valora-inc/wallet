import React, { RefObject, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import { mostPopularDappsSelector } from 'src/dapps/selectors'
import { ActiveDapp, DappSection, DappV1, DappV2 } from 'src/dapps/types'
import { DappCardContent } from 'src/dappsExplorer/DappCard'
import Trophy from 'src/icons/Trophy'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function DappRankingsCard({ onPress }: { onPress: () => void }) {
  const { t } = useTranslation()

  const { dappRankingsEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.DAPP_RANKINGS]
  )

  const mostPopularDapps = useSelector(mostPopularDappsSelector)
  const showDappRankings = dappRankingsEnabled && mostPopularDapps.length > 0

  useEffect(() => {
    if (showDappRankings) {
      ValoraAnalytics.track(DappExplorerEvents.dapp_rankings_impression)
    }
  }, [showDappRankings])

  if (!showDappRankings) {
    return null
  }

  return (
    <Touchable style={styles.pressableCard} onPress={onPress} testID="DappRankings">
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

export function DappRankingsBottomSheet({
  forwardedRef,
  onPressDapp,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  onPressDapp: (dapp: ActiveDapp) => void
}) {
  const { t } = useTranslation()
  const mostPopularDapps = useSelector(mostPopularDappsSelector)

  const handleOnPress = (dapp: DappV1 | DappV2) => () => {
    onPressDapp({ ...dapp, openedFrom: DappSection.MostPopular })
  }

  const handleFavoriteDapp = () => {
    // TODO
  }

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('dappRankings.title')}
      description={t('dappRankings.description')}
      testId="DappRankingsBottomSheet"
    >
      {mostPopularDapps.map((dapp, index) => (
        <View
          key={dapp.name}
          style={[
            styles.popularDappCard,
            {
              borderBottomWidth: index < mostPopularDapps.length - 1 ? 1 : 0,
            },
          ]}
          testID="PopularDappCard"
        >
          <Touchable
            style={styles.popularDappCardContentContainer}
            onPress={handleOnPress(dapp)}
            testID={`Dapp/${dapp.id}`}
          >
            <>
              <Text style={styles.subtitle}>{index + 1}</Text>
              <DappCardContent dapp={dapp} onFavoriteDapp={handleFavoriteDapp} />
            </>
          </Touchable>
        </View>
      ))}
    </BottomSheet>
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
  popularDappCard: {
    borderBottomColor: Colors.gray2,
    borderBottomWidth: 1,
  },
  popularDappCardContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
