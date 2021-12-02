import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { useTokenInfo } from 'src/tokens/hooks'

interface Props {
  tokenAmount: BigNumber
  tokenAddress: string
  feeToAddInUsd?: BigNumber | undefined
}

export default function TokenTotalLineItem({ tokenAmount, tokenAddress, feeToAddInUsd }: Props) {
  const { t } = useTranslation()
  const tokenInfo = useTokenInfo(tokenAddress)
  const feeInToken = tokenInfo ? feeToAddInUsd?.dividedBy(tokenInfo.usdPrice) : undefined

  return (
    <>
      <LineItemRow
        title={t('total')}
        textStyle={fontStyles.regular600}
        amount={
          <TokenDisplay
            amount={tokenAmount.plus(feeInToken ?? 0)}
            tokenAddress={tokenAddress}
            testID="TotalLineItem/Total"
          />
        }
      />
      <LineItemRow
        title={
          <Text style={styles.exchangeRate} testID="TotalLineItem/ExchangeRate">
            {tokenInfo?.symbol}
            {' @ '}
            <TokenDisplay
              amount={new BigNumber(1)}
              tokenAddress={tokenAddress}
              showLocalAmount={true}
            />
          </Text>
        }
        amount={
          <TokenDisplay
            amount={tokenAmount}
            tokenAddress={tokenAddress}
            showLocalAmount={false}
            testID="TotalLineItem/Subtotal"
          />
        }
        style={styles.subtotal}
        textStyle={styles.subtotalText}
      />
    </>
  )
}

const styles = StyleSheet.create({
  subtotal: {
    marginVertical: 0,
  },
  subtotalText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  exchangeRate: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})
