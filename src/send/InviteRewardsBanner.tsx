import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { INVITE_REWARDS_LEARN_MORE } from 'src/config'
import { notificationInvite } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { inviteRewardCusdSelector } from 'src/send/selectors'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { Currency } from 'src/utils/currencies'

export function InviteRewardsBanner() {
  const { t } = useTranslation()
  const rewardAmount = useSelector(inviteRewardCusdSelector)

  const { IS_IN_EUROPE } = useCountryFeatures()
  const currency = IS_IN_EUROPE ? Currency.Euro : Currency.Dollar

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
        <Text style={fontStyles.small600}>
          {t('inviteRewardsBanner.title', { amount: rewardAmount, currency })}
        </Text>
        <Text style={styles.bodyText}>
          <Trans
            i18nKey="inviteRewardsBanner.body"
            tOptions={{ amount: rewardAmount, maxAmount: 5 * rewardAmount, currency }}
          >
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
    textDecorationLine: 'underline',
  },
})
