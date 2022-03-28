import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { notificationInvite } from 'src/images/Images'
import useSelector from 'src/redux/useSelector'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { Currency } from 'src/utils/currencies'

export function InviteRewardsBanner() {
  const { t } = useTranslation()
  const rewardAmount = useSelector((state) => state.send.inviteRewardCusd)

  const { IS_IN_EUROPE } = useCountryFeatures()
  const currency = IS_IN_EUROPE ? Currency.Euro : Currency.Dollar

  return (
    <View style={styles.container} testID="InviteRewardsBanner">
      <Image source={notificationInvite} resizeMode="contain" />
      <View style={styles.textContainer}>
        <Text style={fontStyles.small500}>
          {t('inviteRewardsBanner.title', { amount: rewardAmount, currency })}
        </Text>
        <Text style={styles.bodyText}>
          {t('inviteRewardsBanner.body', { amount: rewardAmount, currency })}
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
})
