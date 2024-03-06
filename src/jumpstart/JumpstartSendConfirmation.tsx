import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
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

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartSendConfirmation>

function JumpstartSendConfirmation({ route }: Props) {
  const { token, parsedAmount } = route.params
  const { t } = useTranslation()

  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)

  const handleSendTransaction = () => {
    // TODO - send transaction

    ValoraAnalytics.track(JumpstartEvents.jumpstart_send_confirm, {
      localCurrency: localCurrencyCode,
      localCurrencyExchangeRate: usdToLocalRate,
      tokenSymbol: token.symbol,
      tokenAmount: parsedAmount.toString(),
      amountInUsd: parsedAmount.multipliedBy(token.priceUsd ?? 0).toFixed(2),
      tokenId: token.tokenId,
      networkId: token.networkId,
    })
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
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
