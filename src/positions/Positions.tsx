import BigNumber from 'bignumber.js'
import React from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import TokenDisplay from 'src/components/TokenDisplay'
import { positionsSelector, positionsStatusSelector } from 'src/positions/selectors'
import { BaseToken, Position, Token } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'

function getBaseTokens(tokens: Token[]): BaseToken[] {
  return tokens.flatMap((token) => {
    if (token.type === 'base-token') {
      return [token]
    } else {
      return getBaseTokens(token.tokens)
    }
  })
}

function PositionItem({ position }: { position: Position }) {
  const tokens = useSelector(tokensByAddressSelector)

  const baseTokens = getBaseTokens(position.tokens)
  const baseTokenImages = baseTokens
    .map((token) => {
      const tokenInfo = tokens[token.address]
      return tokenInfo ? tokenInfo.imageUrl : undefined
    })
    .filter((image) => image !== undefined)

  const balanceInDecimal =
    position.type === 'contract-position' ? undefined : new BigNumber(position.balance)
  const balanceUsd =
    position.type === 'contract-position'
      ? new BigNumber(position.balanceUsd)
      : new BigNumber(position.balance).multipliedBy(position.priceUsd)

  return (
    <View style={styles.tokenContainer}>
      <View style={styles.row}>
        <View style={{ flexDirection: 'row-reverse' }}>
          {baseTokenImages.reverse().map((image, index) => (
            <Image
              source={{ uri: image }}
              style={[styles.tokenImg, { marginRight: index > 0 ? -20 : 12 }]}
              key={index}
            />
          ))}
        </View>
        <View style={styles.tokenLabels}>
          <Text style={styles.tokenName}>{position.label}</Text>
          <Text style={styles.subtext}>{position.appId}</Text>
        </View>
      </View>
      <View style={styles.balances}>
        {balanceInDecimal && (
          <TokenDisplay
            amount={balanceInDecimal}
            // Hack to display the token balance without having said token in the base token list
            currency={Currency.Celo}
            style={styles.tokenAmt}
            showLocalAmount={false}
            showSymbol={false}
          />
        )}
        {!balanceInDecimal && <Text style={styles.tokenAmt}>{'-'}</Text>}
        {balanceUsd.gt(0) && (
          <View style={styles.fiatContainer}>
            <TokenDisplay
              amount={balanceUsd}
              currency={Currency.Dollar}
              style={{ ...styles.subtext, marginLeft: 8 }}
            />
          </View>
        )}
      </View>
    </View>
  )
}

// Temporary component to display positions until we have finalized designs
export default function Positions() {
  const positions = useSelector(positionsSelector)
  const status = useSelector(positionsStatusSelector)

  if (!getFeatureGate({ featureGateName: StatsigFeatureGates.SHOW_POSITIONS })) {
    return null
  }

  if (positions.length === 0 && status === 'loading') {
    return <ActivityIndicator />
  }

  return (
    <>
      {positions.map((position) => (
        <PositionItem key={position.address} position={position} />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  tokenImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  tokenContainer: {
    flexDirection: 'row',
    paddingTop: variables.contentPadding,
  },
  tokenLabels: {
    flexShrink: 1,
    flexDirection: 'column',
  },
  balances: {
    flex: 4,
    alignItems: 'flex-end',
  },
  row: {
    flex: 11,
    flexDirection: 'row',
  },
  tokenName: {
    ...fontStyles.large600,
  },
  subtext: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
  tokenAmt: {
    ...fontStyles.large600,
  },
  fiatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
})
