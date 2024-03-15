import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { defaultCountryCodeSelector, e164NumberSelector } from 'src/account/selectors'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { NotificationVariant } from 'src/components/InLineNotification'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import Toast from 'src/components/Toast'
import AttentionIcon from 'src/icons/Attention'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { useRevokeCurrentPhoneNumber } from 'src/verify/hooks'

interface Props {
  forwardedRef: React.RefObject<BottomSheetRefType>
}

const TOAST_DISMISS_TIMEOUT_MS = 5_000

export const RevokePhoneNumber = ({ forwardedRef }: Props) => {
  const { t } = useTranslation()
  const revokeNumberAsync = useRevokeCurrentPhoneNumber()

  const [showRevokeSuccess, setShowRevokeSuccess] = useState(false)

  const e164PhoneNumber = useSelector(e164NumberSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)

  useEffect(() => {
    if (revokeNumberAsync.status === 'success') {
      forwardedRef.current?.close()
      setShowRevokeSuccess(true)
    } else if (revokeNumberAsync.status === 'error') {
      forwardedRef.current?.close()
      Logger.showError(
        t('revokePhoneNumber.revokeError') ?? new Error('Could not unlink phone number')
      )
    }

    const timeout = setTimeout(() => setShowRevokeSuccess(false), TOAST_DISMISS_TIMEOUT_MS)
    return () => {
      clearTimeout(timeout)
    }
  }, [revokeNumberAsync.status])

  const handleNavigateToVerifiedNumber = () => {
    navigate(Screens.VerificationStartScreen, { hasOnboarded: true })
  }

  const handleRevokePhoneNumber = async () => {
    ValoraAnalytics.track(SettingsEvents.settings_revoke_phone_number_confirm)
    try {
      await revokeNumberAsync.execute()
    } catch (error) {
      // the error handler for revokeNumberAsync handles the error but it is
      // incorrectly propagated
      // https://github.com/slorber/react-async-hook/issues/85
    }
  }

  return (
    <>
      <BottomSheet
        forwardedRef={forwardedRef}
        title={t('revokePhoneNumber.bottomSheetTitle')}
        testId="RevokePhoneNumberBottomSheet"
      >
        {e164PhoneNumber && (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode ?? undefined}
          />
        )}
        <View style={styles.container}>
          <AttentionIcon />
          <Text style={styles.warningText}>{t('revokePhoneNumber.description')}</Text>
        </View>
        <Button
          text={t('revokePhoneNumber.confirmButton')}
          onPress={handleRevokePhoneNumber}
          size={BtnSizes.FULL}
          type={BtnTypes.PRIMARY}
          showLoading={revokeNumberAsync.loading}
          testID="RevokePhoneNumberBottomSheet/PrimaryAction"
        />
      </BottomSheet>
      <Toast
        showToast={showRevokeSuccess}
        variant={NotificationVariant.Info}
        hideIcon
        description={t('revokePhoneNumber.revokeSuccess')}
        ctaLabel={t('revokePhoneNumber.addNewNumberButton')}
        onPressCta={handleNavigateToVerifiedNumber}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.warningLight,
    borderRadius: 4,
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Thick24,
    padding: Spacing.Regular16,
  },
  warningText: {
    ...fontStyles.xsmall,
    flex: 1,
    flexWrap: 'wrap',
    marginLeft: Spacing.Small12,
  },
})

export default RevokePhoneNumber
