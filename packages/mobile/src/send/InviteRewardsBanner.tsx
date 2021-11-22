import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { INVITE_REWARDS_TERMS_LINK } from 'src/config'
import { notificationInvite } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { Currency } from 'src/utils/currencies'

export function InviteRewardsBanner() {
  const { t } = useTranslation()
  const rewardAmount = useSelector((state) => state.send.inviteRewardCusd)

  const openInviteTerms = () => {
    navigate(Screens.WebViewScreen, { uri: INVITE_REWARDS_TERMS_LINK })
  }

  const { USE_CEUR } = useCountryFeatures()
  const currency = USE_CEUR ? Currency.Euro : Currency.Dollar

  return (
    <Touchable testID="InviteRewardsBanner" onPress={openInviteTerms}>
      <View style={styles.container}>
        <Image source={notificationInvite} resizeMode="contain" />
        <View style={styles.textContainer}>
          <Text style={fontStyles.small500}>
            {t('inviteRewardsBanner.title', { amount: rewardAmount, currency })}
          </Text>
          <Text style={styles.bodyText}>
            <Trans
              i18nKey={'inviteRewardsBanner.body'}
              tOptions={{ amount: rewardAmount, currency }}
            >
              <Text style={styles.learnMore} />
            </Trans>
          </Text>
        </View>
      </View>
    </Touchable>
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
    ...fontStyles.small,
    color: colors.greenUI,
  },
})
