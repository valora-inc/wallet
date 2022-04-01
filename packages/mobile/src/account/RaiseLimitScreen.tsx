import React, { useEffect, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { updateDailyLimitRequestStatus } from 'src/account/actions'
import { sendEmail } from 'src/account/emailSender'
import { DailyLimitRequestStatus } from 'src/account/reducer'
import { cUsdDailyLimitSelector, dailyLimitRequestStatusSelector } from 'src/account/selectors'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { CELO_SUPPORT_EMAIL_ADDRESS } from 'src/config'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import i18n from 'src/i18n'
import ApprovedIcon from 'src/icons/ApprovedIcon'
import DeniedIcon from 'src/icons/DeniedIcon'
import InProgressIcon from 'src/icons/InProgressIcon'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const UNLIMITED_THRESHOLD = 99999999

const RaiseLimitScreen = () => {
  const { t } = useTranslation()
  const dailyLimit = useSelector(cUsdDailyLimitSelector)
  const dailyLimitRequestStatus = useSelector(dailyLimitRequestStatusSelector)
  const numberIsVerified = useSelector((state) => state.app.numberVerified)
  const address = useSelector(currentAccountSelector)
  const dispatch = useDispatch()

  const applicationStatusResult = useAsync(async () => {
    if (!address) {
      return null
    }
    return readOnceFromFirebase(`dailyLimitRequest/${address}`)
  }, [address])

  useEffect(() => {
    if (applicationStatusResult.result in DailyLimitRequestStatus) {
      dispatch(updateDailyLimitRequestStatus(applicationStatusResult.result))
    }
  }, [applicationStatusResult.result])

  useEffect(() => {
    if (
      dailyLimitRequestStatus !== DailyLimitRequestStatus.Approved &&
      dailyLimit > UNLIMITED_THRESHOLD
    ) {
      dispatch(updateDailyLimitRequestStatus(DailyLimitRequestStatus.Approved))
    }
  }, [dailyLimitRequestStatus])

  const applicationStatusTexts = useMemo(() => {
    if (!dailyLimitRequestStatus) {
      return null
    }
    return {
      [DailyLimitRequestStatus.InReview]: {
        title: t('applicationInReview'),
        description: t('applicationInReviewDescription'),
        icon: <InProgressIcon />,
      },
      [DailyLimitRequestStatus.Incomplete]: {
        title: t('applicationIncomplete'),
        description: t('applicationIncompleteDescription'),
        icon: <DeniedIcon />,
      },
      [DailyLimitRequestStatus.Denied]: {
        title: t('applicationDenied'),
        description: t('applicationDeniedDescription'),
        icon: <DeniedIcon />,
      },
      [DailyLimitRequestStatus.Approved]: {
        title: t('applicationCompleted'),
        description: t('applicationCompletedDescription'),
        icon: <ApprovedIcon />,
      },
    }[dailyLimitRequestStatus]
  }, [dailyLimitRequestStatus])

  const buttonText = (() => {
    if (!dailyLimitRequestStatus) {
      return numberIsVerified ? t('raiseLimitBegin') : t('raiseLimitConfirmNumber')
    }
    if (
      dailyLimitRequestStatus === DailyLimitRequestStatus.InReview ||
      dailyLimitRequestStatus === DailyLimitRequestStatus.Approved
    ) {
      return null
    }
    return dailyLimitRequestStatus === DailyLimitRequestStatus.Incomplete
      ? t('raiseLimitResume')
      : t('raiseLimitBegin')
  })()

  const onPressButton = async () => {
    try {
      if (!numberIsVerified) {
        navigate(Screens.VerificationEducationScreen)
        return
      }
      await sendEmail({
        subject: t('raiseLimitEmailSubject'),
        recipients: [CELO_SUPPORT_EMAIL_ADDRESS],
        body: t('raiseLimitEmailBody', { dailyLimit, address }),
        isHTML: true,
      })
      navigateBack()
      dispatch(showMessage(t('raiseLimitEmailSuccess')))
    } catch (error) {
      dispatch(showError(ErrorMessages.RAISE_LIMIT_EMAIL_NOT_SENT))
      Logger.error('RaiseLimitScreen', 'Error sending daily limit raise request', error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.labelText}>{t('dailyLimitLabel')}</Text>
      <Text style={styles.dailyLimitValue}>
        {dailyLimit > UNLIMITED_THRESHOLD
          ? t('noDailyLimit')
          : t('dailyLimitValue', { dailyLimit })}
      </Text>
      {!dailyLimitRequestStatus && (
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
      <View style={styles.fillEmptySpace} />
      {buttonText && (
        <Button
          onPress={onPressButton}
          text={buttonText}
          type={
            !numberIsVerified && !dailyLimitRequestStatus ? BtnTypes.SECONDARY : BtnTypes.PRIMARY
          }
          size={BtnSizes.FULL}
          style={styles.button}
          testID="RaiseLimitButton"
        />
      )}
    </SafeAreaView>
  )
}

RaiseLimitScreen.navOptions = () => ({
  ...headerWithBackButton,
  headerTitle: i18n.t('accountSendLimit'),
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: variables.contentPadding,
  },
  labelText: {
    ...fontStyles.label,
    color: colors.gray4,
    marginBottom: 8,
  },
  dailyLimitValue: {
    ...fontStyles.regular500,
    marginBottom: 16,
  },
  bodyText: {
    ...fontStyles.small,
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
  fillEmptySpace: {
    flex: 1,
  },
  button: {
    marginBottom: 24,
  },
})

export default RaiseLimitScreen
