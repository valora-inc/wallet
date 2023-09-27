import BigNumber from 'bignumber.js'
import React from 'react'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import NonNativeTokenDisplay from 'src/components/NonNativeTokenDisplay'
import { useTokenInfoWithAddressBySymbol } from 'src/tokens/hooks'
import { CiCoCurrency } from 'src/utils/currencies'

export function CryptoAmount({
  amount,
  currency,
  testID,
}: {
  amount: BigNumber.Value
  currency: CiCoCurrency
  testID?: string
}) {
  const { address } = useTokenInfoWithAddressBySymbol(currency) ?? {}
  return (
    <NonNativeTokenDisplay
      amount={amount}
      tokenAddress={address}
      showLocalAmount={false}
      testID={testID}
    />
  )
}

export function FiatAmount({
  amount,
  currency,
  testID,
  formatType,
}: {
  amount: BigNumber.Value
  currency: string
  testID?: string
  formatType?: FormatType
}) {
  return (
    <CurrencyDisplay
      amount={{
        // The value and currencyCode here doesn't matter since the component will use `localAmount`
        value: 0,
        currencyCode: '',
        localAmount: {
          value: amount,
          currencyCode: currency,
          exchangeRate: 1,
        },
      }}
      formatType={formatType}
      testID={testID}
    />
  )
}
