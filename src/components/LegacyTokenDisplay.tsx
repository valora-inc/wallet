import BigNumber from 'bignumber.js'
import * as React from 'react'
import { StyleProp, TextStyle } from 'react-native'
import { useTokenInfoByAddress, useTokenInfoWithAddressBySymbol } from 'src/tokens/hooks'
import { LocalAmount } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import TokenDisplay from 'src/components/TokenDisplay'

interface Props {
  amount: BigNumber.Value
  tokenAddress?: string | null
  currency?: Currency
  showSymbol?: boolean
  showLocalAmount?: boolean
  hideSign?: boolean
  showExplicitPositiveSign?: boolean
  localAmount?: LocalAmount
  style?: StyleProp<TextStyle>
  testID?: string
}

/**
 * @deprecated use TokenDisplay instead
 */
function LegacyTokenDisplay({
  amount,
  tokenAddress,
  currency,
  showLocalAmount = true,
  showSymbol = true,
  showExplicitPositiveSign = false,
  hideSign = false,
  localAmount,
  style,
  testID,
}: Props) {
  const showNativeTokens = getFeatureGate(StatsigFeatureGates.SHOW_NATIVE_TOKENS)
  if (!showNativeTokens && (tokenAddress ? currency : !currency)) {
    throw new Error(
      'LegacyTokenDisplay must be passed either "currency" or "tokenAddress" and not both'
    )
  } else if (tokenAddress && currency) {
    throw new Error(
      'LegacyTokenDisplay must be passed tokenAddress, currency, or nethier, but not both'
    )
  }

  const tokenInfoFromAddress = useTokenInfoByAddress(tokenAddress)
  const tokenInfoFromCurrency = useTokenInfoWithAddressBySymbol(
    currency! === Currency.Celo ? 'CELO' : currency!
  )
  const tokenInfo = tokenInfoFromAddress || tokenInfoFromCurrency
  return (
    <TokenDisplay
      amount={amount}
      tokenId={tokenInfo?.tokenId}
      showLocalAmount={showLocalAmount}
      showSymbol={showSymbol}
      showExplicitPositiveSign={showExplicitPositiveSign}
      hideSign={hideSign}
      localAmount={localAmount}
      style={style}
      testID={testID}
    />
  )
}

export default LegacyTokenDisplay
