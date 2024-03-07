import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Touchable from 'src/components/Touchable'
import { mostPopularDappsSelector } from 'src/dapps/selectors'
import Trophy from 'src/icons/Trophy'
import Wallet from 'src/icons/Wallet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { positionsWithClaimableRewardsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  title: string
  description: string
  onPress: () => void
  Image: React.ReactNode
  style?: StyleProp<ViewStyle>
}

function FeaturedAction({ title, description, Image, style, onPress }: Props) {
  return (
    <Touchable style={[styles.pressableCard, style]} onPress={onPress} testID="DappFeaturedAction">
      <View style={styles.cardContainer}>
        {Image}
        <View style={styles.cardContentContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{description}</Text>
        </View>
      </View>
    </Touchable>
  )
}

export function DappFeaturedActions({
  onPressShowDappRankings,
}: {
  onPressShowDappRankings: () => void
}) {
  const { t } = useTranslation()

  const { dappRankingsEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.DAPP_RANKINGS]
  )
  const mostPopularDapps = useSelector(mostPopularDappsSelector)
  const showDappRankings = dappRankingsEnabled && mostPopularDapps.length > 0

  const dappShortcutsEnabled = getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)
  const showClaimRewards = dappShortcutsEnabled && positionsWithClaimableRewards.length > 0

  // TODO impression analytics on scroll

  const handleShowRewardsShortcuts = () => {
    navigate(Screens.DappShortcutsRewards)
  }

  const scrollEnabled = showDappRankings && showClaimRewards // more than one item in the view

  if (!showDappRankings && !showClaimRewards) {
    return null
  }

  return (
    <ScrollView
      horizontal={true}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsHorizontalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
    >
      {showClaimRewards && (
        <FeaturedAction
          title={t('dappShortcuts.rewards.title')}
          description={t('dappShortcuts.rewards.description')}
          Image={<Wallet />}
          onPress={handleShowRewardsShortcuts}
          style={scrollEnabled ? styles.reducedWidthCard : undefined}
        />
      )}

      {showDappRankings && (
        <FeaturedAction
          title={t('dappRankings.title')}
          description={t('dappRankings.description')}
          onPress={onPressShowDappRankings}
          Image={<Trophy />}
          style={
            scrollEnabled
              ? [
                  styles.reducedWidthCard,
                  {
                    marginRight: 0,
                  },
                ]
              : undefined
          }
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -Spacing.Thick24,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
  },
  pressableCard: {
    padding: Spacing.Regular16,
    borderRadius: 8,
    marginTop: Spacing.Smallest8,
    marginBottom: Spacing.Thick24,
    borderWidth: 1,
    borderColor: Colors.gray2,
    width: variables.width - Spacing.Thick24 * 2,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContentContainer: {
    flex: 1,
    marginLeft: Spacing.Small12,
  },
  reducedWidthCard: {
    width: variables.width - Spacing.Thick24 * 4,
    marginRight: Spacing.Regular16,
  },
  title: {
    ...fontStyles.regular600,
    marginBottom: 4,
  },
  subtitle: {
    ...fontStyles.xsmall,
    color: Colors.gray4,
  },
})
