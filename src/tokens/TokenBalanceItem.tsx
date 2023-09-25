import BigNumber from 'bignumber.js'
import React from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

export const TokenBalanceItem = ({ token }: { token: TokenBalance }) => {
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const amountInUsd = token?.usdPrice?.multipliedBy(token.balance)
  const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    amountInUsd ?? 0
  )
  const showAmount = amountInLocalCurrency.isGreaterThan(0)

  return (
    <Touchable>
      <View style={styles.container}>
        <TokenIcon token={token} viewStyle={styles.marginRight} />
        <View style={styles.textContainer}>
          <View style={styles.line}>
            <Text numberOfLines={1} style={styles.label}>
              {token.name}
            </Text>
            {/* Consider moving formatValueToDisplay out of TokenDisplay */}
            <Text numberOfLines={1} style={styles.amount}>
              {formatValueToDisplay(token.balance)} {token.symbol}
            </Text>
          </View>
          <View style={styles.line}>
            {token.networkName ? (
              <Text numberOfLines={1} style={styles.subLabel} testID="NetworkLabel">
                <Trans i18nKey={'assets.networkName'} tOptions={{ networkName: token.networkName }}>
                  <Text />
                </Trans>
              </Text>
            ) : (
              <View />
            )}
            {/* Local value - only display if we have a usd price and local exchange rate */}
            {showAmount ? (
              <Text numberOfLines={1} style={styles.subAmount}>
                {localCurrencySymbol}
                {formatValueToDisplay(amountInLocalCurrency.absoluteValue())}
              </Text>
            ) : (
              <Text numberOfLines={1} style={styles.subAmount}>
                --
              </Text>
            )}
          </View>
          {token.bridge && (
            <View style={styles.line}>
              <Text
                testID="BridgeLabel"
                numberOfLines={1}
                style={[styles.subLabel, { color: colors.informational }]}
              >
                <Trans i18nKey={'assets.bridge'} tOptions={{ bridge: token.bridge }}>
                  <Text />
                </ Trans>
              </Text>
            </View>
          )}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.Thick24,
    marginBottom: Spacing.Large32,
    flex: 1,
  },
  line: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
  },
  amount: {
    ...typeScale.labelMedium,
  },
  subAmount: {
    ...typeScale.bodySmall,
    color: colors.gray3,
  },
  label: {
    ...typeScale.labelMedium,
    overflow: 'hidden',
    flexShrink: 1,
  },
  subLabel: {
    ...typeScale.bodySmall,
    overflow: 'hidden',
    flexShrink: 1,
    color: colors.gray3,
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  marginRight: {
    marginRight: Spacing.Small12,
  },
})
