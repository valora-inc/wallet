import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { notificationInvite } from 'src/images/Images'
import { useSelector } from 'src/redux/hooks'
import { inviteRewardsTypeSelector } from 'src/send/selectors'
import { InviteRewardsType } from 'src/send/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function InviteRewardsCard() {
  const { t } = useTranslation()
  const inviteRewardsType = useSelector(inviteRewardsTypeSelector)

  const inviteRewardsToTranslationPrefix: Record<InviteRewardsType, string | null> = {
    [InviteRewardsType.CUSD]: 'inviteRewardsBannerCUSD',
    [InviteRewardsType.NFT]: 'inviteRewardsBanner',
    [InviteRewardsType.NONE]: null,
  }
  const inviteRewardsTranslationPrefix = inviteRewardsToTranslationPrefix[inviteRewardsType]

  // If no translations are available do not show the banner
  if (inviteRewardsTranslationPrefix === null) {
    return null
  }

  const title = t(`${inviteRewardsTranslationPrefix}.title`)
  const bodyKey = `${inviteRewardsTranslationPrefix}.body`

  return (
    <View testID="InviteRewardsCardContainer" style={styles.container}>
      <View testID="InviteRewardsCard" style={styles.card}>
        <Image source={notificationInvite} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>
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
    backgroundColor: Colors.successLight,
  },
  container: {
    marginHorizontal: Spacing.Thick24,
    marginBottom: Spacing.Regular16,
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typeScale.labelSmall,
  },
  body: {
    ...typeScale.bodySmall,
  },
})
