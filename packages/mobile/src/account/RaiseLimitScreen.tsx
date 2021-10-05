import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { sendEmail } from 'src/account/emailSender'
import Persona from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { cUsdDailyLimitSelector, kycStatusSelector } from 'src/account/selectors'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CELO_SUPPORT_EMAIL_ADDRESS } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'
import ApprovedIcon from 'src/icons/ApprovedIcon'
import DeniedIcon from 'src/icons/DeniedIcon'
import InProgressIcon from 'src/icons/InProgressIcon'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { getRecentPayments } from 'src/send/selectors'
import { dailyAmountRemaining } from 'src/send/utils'
import { Currency } from 'src/utils/currencies'
import { Logger } from 'walletconnect-v2/types'

const RaiseLimitScreen = () => {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const dailyLimit = useSelector(cUsdDailyLimitSelector)
  const kycStatus = useSelector(kycStatusSelector)
  const numberIsVerified = useSelector((state) => state.app.numberVerified)
  const recentPayments = useSelector(getRecentPayments)
  const accountAddress = useSelector(accountAddressSelector)

  const dispatch = useDispatch()

  const kycAttemptAllowed = !kycStatus || kycStatus === KycStatus.AccountCreated

  const sendSupportEmail = async () => {
    try {
      await sendEmail({
        subject: t('kycEmailSubject'),
        recipients: [CELO_SUPPORT_EMAIL_ADDRESS],
        body: t('kycEmailBody', { address: accountAddress }),
        isHTML: true,
      })

      dispatch(showMessage(t('kycEmailSuccess')))
    } catch (error) {
      dispatch(showError(ErrorMessages.KYC_EMAIL_NOT_SENT))
      Logger.error('Error sending indentity verification email', error)
    }
  }

  const applicationStatusTexts = useMemo(() => {
    if (kycAttemptAllowed) {
      return null
    }

    return {
      [KycStatus.PendingReview]: {
        title: t('applicationInReview'),
        description: t('applicationInReviewDescription'),
        icon: <InProgressIcon />,
      },
      [KycStatus.Denied]: {
        title: t('applicationDenied'),
        description: t('applicationDeniedDescription'),
        icon: <DeniedIcon />,
      },
      [KycStatus.Verified]: {
        title: t('applicationCompleted'),
        description: t('applicationCompletedDescription'),
        icon: <ApprovedIcon />,
      },
    }[kycStatus]
  }, [kycStatus])

  const renderButton = () => {
    if (kycStatus === KycStatus.Denied) {
      return (
        <Button
          onPress={sendSupportEmail}
          text={t('contactSupport')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.button}
          testID="ContactSupportButton"
        />
      )
    }

    if (!kycStatus || kycStatus === KycStatus.AccountCreated) {
      return numberIsVerified ? (
        <Persona kycStatus={kycStatus} />
      ) : (
        <Button
          onPress={() => navigate(Screens.VerificationEducationScreen)}
          text={t('raiseLimitConfirmNumber')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.button}
          testID="RaiseLimitButton"
        />
      )
    }

    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dailyLimitContainer}>
        <Text style={styles.labelText}>{t('dailyLimitLabel')}</Text>
        {kycStatus === KycStatus.Verified ? (
          <Text style={styles.dailyLimit}>{t('noDailyLimit')} </Text>
        ) : (
          <>
            <CurrencyDisplay
              amount={{ value: dailyLimit, currencyCode: Currency.Dollar }}
              style={styles.dailyLimit}
            />
            <Text style={styles.dailyLimitSubtext}>{t('dailyLimitValue', { dailyLimit })}</Text>
          </>
        )}
      </View>
      <Text style={styles.bodyText}>
        <Trans i18nKey={'dailyLimitExplainer'} ns={Namespaces.accountScreen10}>
          <CurrencyDisplay
            amount={{
              value: dailyAmountRemaining(Date.now(), recentPayments, dailyLimit),
              currencyCode: Currency.Dollar,
            }}
          />
        </Trans>
      </Text>
      {kycAttemptAllowed && (
        <Text style={styles.bodyText}>
          {numberIsVerified ? t('verifyIdentityToRaiseLimit') : t('verifyNumberToRaiseLimit')}
        </Text>
      )}
      {applicationStatusTexts && (
        <>
          <View style={styles.separator} />
          <Text style={styles.labelText}>{t('dailyLimitApplicationStatus')}</Text>
          <View style={styles.applicationStatusContainer}>
            {applicationStatusTexts.icon}
            <Text style={styles.applicationStatusTitle} testID="ApplicationStatus">
              {applicationStatusTexts.title}
            </Text>
          </View>
          <Text style={styles.bodyText}>{applicationStatusTexts.description}</Text>
        </>
      )}
      {renderButton()}
    </SafeAreaView>
  )
}

RaiseLimitScreen.navOptions = () => ({
  ...headerWithBackButton,
  headerTitle: i18n.t('accountScreen10:accountSendLimit'),
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: variables.contentPadding,
  },
  dailyLimitContainer: {
    marginBottom: 24,
  },
  labelText: {
    ...fontStyles.label,
    color: colors.gray4,
    marginBottom: 8,
  },
  dailyLimit: {
    ...fontStyles.mediumNumberBold,
  },
  dailyLimitSubtext: {
    ...fontStyles.small500,
    marginTop: 4,
  },
  bodyText: {
    ...fontStyles.small,
    marginBottom: 8,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
    marginBottom: 16,
  },
  applicationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  applicationStatusTitle: {
    ...fontStyles.regular500,
    marginLeft: 6,
  },
  button: {
    marginVertical: 24,
  },
})

export default RaiseLimitScreen
