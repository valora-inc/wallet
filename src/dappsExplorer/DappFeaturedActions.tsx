import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import Touchable from 'src/components/Touchable'
import Reward from 'src/icons/Reward'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { positionsWithClaimableRewardsSelector } from 'src/positions/selectors'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
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
    <Touchable
      style={[styles.pressableCard, style]}
      onPress={onPress}
      testID="DappFeaturedAction"
      borderRadius={8}
    >
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

export function DappFeaturedActions() {
  const { t } = useTranslation()

  const dappShortcutsEnabled = getFeatureGate(StatsigFeatureGates.SHOW_CLAIM_SHORTCUTS)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)
  const showClaimRewards = dappShortcutsEnabled && positionsWithClaimableRewards.length > 0

  // TODO impression analytics on scroll

  const handleShowRewardsShortcuts = () => {
    navigate(Screens.DappShortcutsRewards)
  }

  const scrollEnabled = false // only set to true if there can be more than one item in the view

  if (!showClaimRewards) {
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
          Image={<Reward />}
          onPress={handleShowRewardsShortcuts}
          style={scrollEnabled ? styles.reducedWidthCard : undefined}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -Spacing.Thick24,
    paddingTop: Spacing.Smallest8,
    paddingBottom: Spacing.Thick24,
  },
  contentContainer: {
    paddingHorizontal: Spacing.Thick24,
    gap: Spacing.Regular16,
  },
  pressableCard: {
    padding: Spacing.Regular16,
    borderRadius: 8,
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
  },
  title: {
    ...typeScale.labelSemiBoldMedium,
    marginBottom: 4,
  },
  subtitle: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
})
