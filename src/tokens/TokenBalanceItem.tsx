import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View, ViewStyle } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon from 'src/components/TokenIcon'
import Touchable from 'src/components/Touchable'
import { NETWORK_NAMES } from 'src/shared/conts'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'

interface Props {
  token: TokenBalance
  onPress?: () => void
  containerStyle?: ViewStyle
}

export const TokenBalanceItem = ({ token, onPress, containerStyle }: Props) => {
  const { t } = useTranslation()

  const Content = ({ token, containerStyle }: Props) => {
    return (
      <View style={[styles.container, containerStyle]} testID="TokenBalanceItem">
        <TokenIcon token={token} viewStyle={styles.marginRight} />
        <View style={styles.textContainer}>
          <View style={styles.line}>
            <Text numberOfLines={1} style={[styles.label, styles.marginRight]}>
              {token.name}
            </Text>
            <TokenDisplay
              style={styles.amount}
              amount={token.balance}
              tokenId={token.tokenId}
              showSymbol={true}
              hideSign={true}
              showLocalAmount={false}
            />
          </View>
          <View style={styles.line}>
            {token.networkId in NETWORK_NAMES ? (
              <Text
                numberOfLines={1}
                style={[styles.subLabel, styles.marginRight]}
                testID="NetworkLabel"
              >
                {t('assets.networkName', { networkName: NETWORK_NAMES[token.networkId] })}
              </Text>
            ) : (
              <View />
            )}
            <TokenDisplay
              style={styles.subAmount}
              amount={token.balance}
              tokenId={token.tokenId}
              showSymbol={false}
              hideSign={true}
            />
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
    )
  }

  return onPress ? (
    <Touchable onPress={onPress} testID={`TokenBalanceItemTouchable/${token.tokenId}`}>
      <Content token={token} containerStyle={containerStyle} />
    </Touchable>
  ) : (
    <Content token={token} containerStyle={containerStyle} />
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.Thick24,
    marginVertical: Spacing.Regular16,
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
