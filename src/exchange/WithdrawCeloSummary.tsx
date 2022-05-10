// VIEW Small component that has the details of a withdrawal transaction

import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import TotalLineItem from 'src/components/TotalLineItem'
import fontStyles from 'src/styles/fonts'
import { Currency } from 'src/utils/currencies'

interface WithdrawCeloProps {
  style?: ViewStyle
  amount: BigNumber
  recipientAddress: string
  feeEstimate: BigNumber
}

export default function WithdrawCeloSummary({
  style,
  amount,
  recipientAddress,
  feeEstimate,
}: WithdrawCeloProps) {
  const { t } = useTranslation()

  return (
    <View style={style}>
      <LineItemRow
        title={t('withdrawCeloAmount')}
        textStyle={fontStyles.regular}
        amount={
          <CurrencyDisplay
            amount={{
              value: amount,
              currencyCode: Currency.Celo,
            }}
          />
        }
      />
      <FeeDrawer
        testID={'feeDrawer/WithdrawCelo'}
        currency={Currency.Celo}
        isExchange={false}
        isEstimate={true}
        securityFee={feeEstimate}
        totalFee={feeEstimate}
      />
      <TotalLineItem
        amount={{
          value: amount,
          currencyCode: Currency.Celo,
        }}
      />
    </View>
  )
}
