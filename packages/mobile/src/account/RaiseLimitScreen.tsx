import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useEffect, useMemo } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { updateDailyLimitRequestStatus } from 'src/account/actions'
import { useLaunchPersonaInquiry } from 'src/account/hooks'
import { DailyLimitRequestStatus } from 'src/account/reducer'
import { cUsdDailyLimitSelector, dailyLimitRequestStatusSelector } from 'src/account/selectors'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { readOnceFromFirebase } from 'src/firebase/firebase'
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
import { currentAccountSelector } from 'src/web3/selectors'

const UNLIMITED_THRESHOLD = 99999999

const RaiseLimitScreen = () => {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const dailyLimit = useSelector(cUsdDailyLimitSelector)
  const dailyLimitRequestStatus = useSelector(dailyLimitRequestStatusSelector)
  const numberIsVerified = useSelector((state) => state.app.numberVerified)
  const address = useSelector(currentAccountSelector)
  const recentPayments = useSelector(getRecentPayments)
  const dispatch = useDispatch()

  const launchPersonaInquiry = useLaunchPersonaInquiry()

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
    if (!numberIsVerified) {
      navigate(Screens.VerificationEducationScreen)
      return
    }
    launchPersonaInquiry()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.dailyLimitContainer}>
        <Text style={styles.labelText}>{t('dailyLimitLabel')}</Text>
        {dailyLimit > UNLIMITED_THRESHOLD ? (
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
