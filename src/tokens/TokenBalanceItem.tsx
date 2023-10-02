import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'
import { formatValueToDisplay } from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { getLocalCurrencySymbol, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

interface TProps {
  token: TokenBalance
}

const TokenBalanceInLocalCurrency = ({ token }: TProps) => {
  const localCurrencyExchangeRate = useSelector(usdToLocalCurrencyRateSelector)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const amountInUsd = token?.priceUsd?.multipliedBy(token.balance)
  const amountInLocalCurrency = new BigNumber(localCurrencyExchangeRate ?? 0).multipliedBy(
    amountInUsd ?? 0
  )
  const showAmount = amountInLocalCurrency.isGreaterThan(0)
  if (!showAmount) {
    return (
      <Text numberOfLines={1} style={styles.subAmount}>
        --
      </Text>
    )
  } else {
    return (
      <Text numberOfLines={1} style={styles.subAmount}>
        {localCurrencySymbol}
        {formatValueToDisplay(amountInLocalCurrency.absoluteValue())}
      </Text>
    )
  }
}

interface Props {
  token: TokenBalance
  onPress?: () => void
  containerStyle?: ViewStyle
}

export const TokenBalanceItem = ({ token, onPress, containerStyle }: Props) => {
  const { t } = useTranslation()

  return (
    <Touchable onPress={onPress}>
      <View style={[styles.container, containerStyle]}>
        <TokenIcon token={token} viewStyle={styles.marginRight} />
        <View style={styles.textContainer}>
          <View style={styles.line}>
            <Text numberOfLines={1} style={[styles.label, styles.marginRight]}>
              {token.name}
            </Text>
            <Text numberOfLines={1} style={styles.amount}>
              {formatValueToDisplay(token.balance)} {token.symbol}
            </Text>
          </View>
          <View style={styles.line}>
            {token.networkName ? (
              <Text numberOfLines={1} style={styles.subLabel} testID="NetworkLabel">
                {t('assets.networkName', { networkName: token.networkName })}
              </Text>
            ) : (
              <View />
            )}
            <TokenBalanceInLocalCurrency token={token} />
          </View>
          {token.bridge && (
            <Text
              testID="BridgeLabel"
              numberOfLines={1}
              style={[styles.subLabel, { color: colors.informational }]}
            >
              {t('assets.bridge', { bridge: token.bridge })}
            </Text>
          )}
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.Thick24,
    marginBottom: Spacing.Large32,
    flexDirection: 'row',
    alignItems: 'center',
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
