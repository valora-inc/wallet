import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Dialog from 'src/components/Dialog'
import { HELP_LINK } from 'src/config'
import colors from 'src/styles/colors'
import { navigateToURI } from 'src/utils/linking'

interface Props {
  isVisible: boolean
  onPressDismiss: () => void
  isCashIn: boolean
}

export default function FundingEducationDialog({ isVisible, onPressDismiss, isCashIn }: Props) {
  const { t } = useTranslation()

  const link = HELP_LINK

  const onPressSupportLink = () => {
    navigateToURI(link)
    ValoraAnalytics.track(
      isCashIn
        ? FiatExchangeEvents.cico_add_funds_info_support
        : FiatExchangeEvents.cico_cash_out_info_support
    )
    // Wait a bit before dismissing to prevent a UI glitch with the popup
    // while the app transitions to the browser
    setTimeout(() => onPressDismiss(), 10)
  }

  const textBase = isCashIn ? 'fundingEducationDialog' : 'cashOutEducationDialog'
  return (
    <Dialog
      title={t(`${textBase}.title`)}
      isVisible={isVisible}
      actionText={t(`${textBase}.dismiss`)}
      actionPress={onPressDismiss}
      isActionHighlighted={false}
      onBackgroundPress={onPressDismiss}
    >
      <Trans
        i18nKey={`${textBase}.body`}
        values={{
          // Don't show the scheme in the link
          link: link.replace(/^https?:\/\//, ''),
        }}
      >
        <Text style={styles.link} onPress={onPressSupportLink} />
      </Trans>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  link: {
    color: colors.greenUI,
  },
})
