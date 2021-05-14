import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { INVITE_REWARDS_TERMS_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import { notificationInvite } from 'src/images/Images'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

export function InviteRewardsBanner() {
  const { t } = useTranslation(Namespaces.inviteFlow11)
  const rewardAmount = useSelector((state) => state.send.inviteRewardCusd)

  const openInviteTerms = () => {
    navigate(Screens.WebViewScreen, { uri: INVITE_REWARDS_TERMS_LINK })
  }

  return (
    <TouchableOpacity
      style={styles.container}
      testID="InviteRewardsBanner"
      onPress={openInviteTerms}
    >
      <Image source={notificationInvite} resizeMode="contain" />
      <View style={styles.textContainer}>
        <Text style={fontStyles.small500}>
          {t('inviteRewardsBanner.title', { amount: rewardAmount })}
        </Text>
        <Text style={styles.bodyText}>
          <Trans i18nKey={'inviteRewardsBanner.body'} ns={Namespaces.inviteFlow11}>
            <Text style={styles.learnMore} />
          </Trans>
        </Text>
      </View>
    </TouchableOpacity>
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
