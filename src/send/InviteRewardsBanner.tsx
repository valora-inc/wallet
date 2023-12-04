import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { INVITE_REWARDS_LEARN_MORE } from 'src/config'
import { notificationInvite } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { inviteRewardsTypeSelector } from 'src/send/selectors'
import { InviteRewardsType } from 'src/send/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

/***
 * @deprecated Used only in the old send flow (src/send/Send.tsx)
 * Use InviteRewardsCard.tsx instead
 */
export function InviteRewardsBanner() {
  const { t } = useTranslation()
  const inviteRewardsType = useSelector(inviteRewardsTypeSelector)

  // Default to NFT invite rewards banner
  let title = t('inviteRewardsBanner.title')
  let bodyKey = 'inviteRewardsBanner.body'

  if (inviteRewardsType === InviteRewardsType.CUSD) {
    title = t('inviteRewardsBannerCUSD.title')
    bodyKey = 'inviteRewardsBannerCUSD.body'
  }

  useEffect(() => {
    ValoraAnalytics.track(InviteEvents.invite_banner_impression)
  }, [])

  const handleOpenInviteTerms = () => {
    navigate(Screens.WebViewScreen, { uri: INVITE_REWARDS_LEARN_MORE })
  }

  return (
    <View style={styles.container} testID="InviteRewardsBanner">
      <Image source={notificationInvite} resizeMode="contain" />
      <View style={styles.textContainer}>
        <Text style={fontStyles.small600}>{title}</Text>
        <Text style={styles.bodyText}>
          <Trans i18nKey={bodyKey}>
            <Text onPress={handleOpenInviteTerms} style={styles.learnMore} />
          </Trans>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 8,
    backgroundColor: colors.greenBackground,
  },
  textContainer: {
    flex: 1,
    paddingLeft: 20,
  },
  bodyText: {
    ...fontStyles.small,
  },
  learnMore: {
    ...fontStyles.small600,
    textDecorationLine: 'underline',
  },
})
