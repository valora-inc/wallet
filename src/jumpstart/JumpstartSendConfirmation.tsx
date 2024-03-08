import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
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
  const { tokenId, sendAmount } = route.params
  const parsedAmount = new BigNumber(sendAmount)
  const { t } = useTranslation()

  const token = useTokenInfo(tokenId)
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)

  const handleSendTransaction = () => {
    if (token) {
      // TODO - send transaction

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

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  return (
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
        />
        <Text style={styles.detailsLabel}>{t('jumpstartSendConfirmationScreen.detailsLabel')}</Text>
        <Text style={styles.detailsText}>{t('jumpstartSendConfirmationScreen.details')}</Text>
      </SafeAreaView>
    </ScrollView>
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
  detailsLabel: {
    ...typeScale.labelXSmall,
    marginBottom: Spacing.Regular16,
  },
  detailsText: {
    ...typeScale.bodySmall,
  },
})

export default JumpstartSendConfirmation
