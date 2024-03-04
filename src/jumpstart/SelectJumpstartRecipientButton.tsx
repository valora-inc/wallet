import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import CircledIcon from 'src/icons/CircledIcon'
import MagicWand from 'src/icons/MagicWand'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'

function SelectRecipientJumpstartButton() {
  const { t } = useTranslation()
  const showJumpstart = getFeatureGate(StatsigFeatureGates.SHOW_JUMPSTART_SEND)
  const jumpstartTokens = useSelector(jumpstartSendTokensSelector)

  const handlePress = () => {
    ValoraAnalytics.track(JumpstartEvents.send_select_recipient_jumpstart)
    navigate(Screens.JumpstartEnterAmount)
  }

  if (!showJumpstart || jumpstartTokens.length === 0) {
    return null
  }

  return (
    <Touchable onPress={handlePress} style={styles.container}>
      <View style={styles.body}>
        <CircledIcon radius={40} backgroundColor={colors.successLight}>
          <MagicWand />
        </CircledIcon>
        <View style={styles.textSection}>
          <Text style={styles.title}>{t('sendSelectRecipient.jumpstart.title')}</Text>
          <Text style={styles.subtitle}>{t('sendSelectRecipient.jumpstart.subtitle')}</Text>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    marginHorizontal: Spacing.Thick24,
  },
  subtitle: {
    ...typeScale.bodyXSmall,
    color: colors.gray3,
  },
  title: {
    ...typeScale.labelMedium,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textSection: {
    paddingLeft: Spacing.Small12,
    flexDirection: 'column',
    flex: 1,
  },
})

export default SelectRecipientJumpstartButton
