import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import Warning from 'src/icons/Warning'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

interface Props {
  token: TokenBalance
  balanceUsdErrorFallback?: string
  onPress?: () => void
  containerStyle?: ViewStyle
  showPriceUsdUnavailableWarning?: boolean
  hideBalances?: boolean
}

export const TokenBalanceItem = ({
  token,
  onPress,
  containerStyle,
  balanceUsdErrorFallback,
  showPriceUsdUnavailableWarning,
  hideBalances = false,
}: Props) => {
  const { t } = useTranslation()

  const Content = (
    <View style={[styles.container, containerStyle]} testID="TokenBalanceItem">
      <TokenIcon token={token} />
      <View style={styles.textContainer}>
        <View style={styles.line}>
          <View style={styles.row}>
            <Text numberOfLines={1} style={styles.label} testID={`${token.symbol}Symbol`}>
              {token.name}
            </Text>
            {showPriceUsdUnavailableWarning && !token.priceUsd && <Warning size={16} />}
          </View>
          {!hideBalances && (
            <TokenDisplay
              style={styles.amount}
              amount={token.balance}
              tokenId={token.tokenId}
              showSymbol={true}
              hideSign={true}
              showLocalAmount={false}
              testID={`${token.symbol}Balance`}
            />
          )}
        </View>
        <View style={styles.line}>
          {token.networkId in NETWORK_NAMES ? (
            <Text numberOfLines={1} style={styles.subLabel} testID="NetworkLabel">
              {t('assets.networkName', { networkName: NETWORK_NAMES[token.networkId] })}
            </Text>
          ) : (
            <View />
          )}
          {!hideBalances && (
            <TokenDisplay
              style={styles.subAmount}
              amount={token.balance}
              tokenId={token.tokenId}
              showSymbol={false}
              hideSign={true}
              errorFallback={balanceUsdErrorFallback}
            />
          )}
        </View>
        {token.bridge && (
          <Text
            testID="BridgeLabel"
            numberOfLines={1}
            style={[styles.subLabel, { color: colors.infoDark }]}
          >
            {t('assets.bridge', { bridge: token.bridge })}
          </Text>
        )}
      </View>
    </View>
  )

  return onPress ? (
    <Touchable onPress={onPress} testID={`TokenBalanceItemTouchable/${token.tokenId}`}>
      {Content}
    </Touchable>
  ) : (
    Content
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.Thick24,
    marginVertical: Spacing.Regular16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.Small12,
  },
  line: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.Smallest8,
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
    marginRight: Spacing.Smallest8,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
})
