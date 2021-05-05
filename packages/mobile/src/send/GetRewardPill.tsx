import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { Namespaces } from 'src/i18n'
import useSelector from 'src/redux/useSelector'

function GetRewardPill() {
  const { t } = useTranslation(Namespaces.inviteFlow11)
  const shouldShowReward = useSelector((state) => state.send.inviteRewardsEnabled)
  const reward = useSelector((state) => state.send.inviteRewardCusd)

  if (!shouldShowReward) {
    return null
  }
  return (
    <View style={styles.container} testID="GetRewardPill">
      <Text style={styles.text}>{t('getReward', { reward })}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.greenBackground,
  },
  text: {
    ...fontStyles.small,
    color: colors.greenStrong,
  },
})

export default GetRewardPill
