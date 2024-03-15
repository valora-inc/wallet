import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import Toast from 'src/components/Toast'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { jumpstartSendStatusSelector } from 'src/jumpstart/selectors'
import { depositErrorDismissed, depositTransactionStarted } from 'src/jumpstart/slice'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartSendConfirmation>

const TAG = 'JumpstartSendConfirmation'

function JumpstartSendConfirmation({ route }: Props) {
  const { tokenId, sendAmount, serializablePreparedTransactions } = route.params
  const parsedAmount = new BigNumber(sendAmount)
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const token = useTokenInfo(tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const jumpstartSendStatus = useSelector(jumpstartSendStatusSelector)

  useEffect(() => {
    if (jumpstartSendStatus === 'success') {
      // TODO: navigate clearing stack to the next screen, navigateHome is just
      // a placeholder for now
      navigateHome()
    }
  }, [jumpstartSendStatus])

  const handleSendTransaction = () => {
    if (token) {
      dispatch(
        depositTransactionStarted({
          sendToken: token,
          sendAmount,
          serializablePreparedTransactions,
        })
      )

      ValoraAnalytics.track(JumpstartEvents.jumpstart_send_confirm, {
        localCurrency: localCurrencyCode,
        localCurrencyExchangeRate: usdToLocalRate,
        tokenSymbol: token.symbol,
        tokenAmount: sendAmount,
        amountInUsd: parsedAmount.multipliedBy(token.priceUsd ?? 0).toFixed(2),
        tokenId: token.tokenId,
        networkId: token.networkId,
      })
    }
  }

  const handleDismissError = () => {
    dispatch(depositErrorDismissed())
  }

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <SafeAreaView edges={['bottom']}>
          <Text style={styles.heading}>{t('jumpstartSendConfirmationScreen.title')}</Text>
          <View style={styles.amountContainer}>
            <View style={styles.amountTextContainer}>
              <Text style={styles.sendAmountLabel}>
                {t('jumpstartSendConfirmationScreen.sendAmountLabel')}
              </Text>
              <TokenDisplay
                style={styles.sendAmount}
                amount={parsedAmount}
                tokenId={token.tokenId}
                showLocalAmount={false}
              />
              <TokenDisplay
                style={styles.sendAmountLocalCurrency}
                amount={parsedAmount}
                tokenId={token.tokenId}
                showLocalAmount
              />
            </View>
            <TokenIcon token={token} size={IconSize.LARGE} />
          </View>
          <Button
            text={t('jumpstartSendConfirmationScreen.confirmButton')}
            onPress={handleSendTransaction}
            size={BtnSizes.FULL}
            style={styles.button}
            showLoading={jumpstartSendStatus === 'loading'}
          />
          <InLineNotification
            variant={NotificationVariant.Info}
            description={t('jumpstartSendConfirmationScreen.info')}
          />
        </SafeAreaView>
      </ScrollView>
      <Toast
        showToast={jumpstartSendStatus === 'error'}
        variant={NotificationVariant.Error}
        title={t('jumpstartSendConfirmationScreen.sendError.title')}
        description={t('jumpstartSendConfirmationScreen.sendError.description')}
        ctaLabel={t('jumpstartSendConfirmationScreen.sendError.ctaLabel')}
        onPressCta={handleDismissError}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
  },
  heading: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Thick24,
  },
  amountContainer: {
    backgroundColor: Colors.gray1,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 16,
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.Thick24,
  },
  amountTextContainer: {
    flex: 1,
  },
  sendAmountLabel: {
    ...typeScale.labelSmall,
    marginBottom: Spacing.Smallest8,
  },
  sendAmount: {
    ...typeScale.titleLarge,
    marginBottom: Spacing.Tiny4,
  },
  sendAmountLocalCurrency: {
    ...typeScale.labelMedium,
  },
  button: {
    marginBottom: Spacing.Large32,
  },
})

export default JumpstartSendConfirmation
