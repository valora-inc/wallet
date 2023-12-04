import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { notificationInvite } from 'src/images/Images'
import { inviteRewardsTypeSelector } from 'src/send/selectors'
import { InviteRewardsType } from 'src/send/types'
import Colors from 'src/styles/colors'
import { Spacing } from 'src/styles/styles'

export default function InviteRewardsCard() {
  const { t } = useTranslation()
  const inviteRewardsType = useSelector(inviteRewardsTypeSelector)

  // Default to NFT invite rewards banner
  let title = t('inviteRewardsBanner.title')
  let bodyKey = 'inviteRewardsBanner.body'

  if (inviteRewardsType === InviteRewardsType.CUSD) {
    title = t('inviteRewardsBannerCUSD.title')
    bodyKey = 'inviteRewardsBannerCUSD.body'
  }

  return (
    <View testID="InviteRewardsCardContainer" style={styles.container}>
      <View testID="InviteRewardsCard" style={styles.card}>
        <Image source={notificationInvite} />
        <View style={styles.textContainer}>
          <Text>{title}</Text>
          <Text>
            <Trans i18nKey={bodyKey} />
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    borderRadius: Spacing.Smallest8,
    backgroundColor: Colors.greenBackground,
  },
  container: {
    marginHorizontal: Spacing.Thick24,
    marginBottom: Spacing.Regular16,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
})
