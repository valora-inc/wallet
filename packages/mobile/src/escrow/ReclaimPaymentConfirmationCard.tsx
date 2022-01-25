import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import { SecurityFeeIcon } from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import { FeeInfo } from 'src/fees/saga'
import { getFeeInTokens } from 'src/fees/selectors'
import { MobileRecipient } from 'src/recipients/recipient'
import { useTokenInfo } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'

interface Props {
  recipientPhone: string
  recipientContact: MobileRecipient
  amount: BigNumber
  feeInfo?: FeeInfo
  isLoadingFee?: boolean
  feeError?: Error
  currency: Currency
}

export default function ReclaimPaymentConfirmationCard({
  recipientPhone,
  recipientContact,
  amount: amountProp,
  feeInfo,
  isLoadingFee,
  feeError,
  currency,
}: Props) {
  const { t } = useTranslation()
  const amount = {
    value: amountProp,
    currencyCode: currency,
  }
  const fee = getFeeInTokens(feeInfo?.fee)

  // TODO: Add support for any allowed fee currency, not just dollar/euro.
  const feeToken = useTokenInfo(feeInfo?.feeCurrency ?? '')
  const feeCurrency = !feeToken
    ? Currency.Celo
    : feeToken.symbol === 'cUSD'
    ? Currency.Dollar
    : Currency.Euro
  const securityFeeAmount = fee &&
    feeInfo && {
      value: fee.negated(),
      currencyCode: feeCurrency,
    }
  const totalAmount = {
    value: amountProp.minus(fee ?? 0),
    currencyCode: amount.currencyCode,
  }

  return (
    <View style={styles.container}>
      <Avatar recipient={recipientContact} e164Number={recipientPhone} />
      <CurrencyDisplay type={DisplayType.Big} amount={amount} />
      <HorizontalLine />
      <LineItemRow title={t('amount')} amount={<CurrencyDisplay amount={amount} />} />
      <LineItemRow
        title={t('securityFee')}
        titleIcon={<SecurityFeeIcon />}
        amount={
          securityFeeAmount && (
            <CurrencyDisplay amount={securityFeeAmount} formatType={FormatType.Fee} />
          )
        }
        isLoading={isLoadingFee}
        hasError={!!feeError}
      />
      <HorizontalLine />
      <TotalLineItem title={t('totalRefunded')} amount={totalAmount} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
})
