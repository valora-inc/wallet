import BigNumber from 'bignumber.js'
import React from 'react'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import TokenDisplay from 'src/components/TokenDisplay'
import { useTokenInfo } from 'src/tokens/hooks'
import { CiCoCurrency } from 'src/utils/currencies'
import networkConfig from 'src/web3/networkConfig'

export function CryptoAmount({
  amount,
  currency,
  testID,
}: {
  amount: BigNumber.Value
  currency: CiCoCurrency
  testID?: string
}) {
  const { tokenId } = useTokenInfo(networkConfig.currencyToTokenId[currency]) ?? {}

  return <TokenDisplay amount={amount} tokenId={tokenId} showLocalAmount={false} testID={testID} />
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
