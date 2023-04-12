import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet from 'src/components/BottomSheet'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { TokenBalance } from 'src/tokens/slice'

export enum TokenPickerOrigin {
  Send = 'Send',
  SendConfirmation = 'SendConfirmation',
  Exchange = 'Exchange',
  Swap = 'Swap',
}

interface Props {
  isVisible: boolean
  origin: TokenPickerOrigin
  onTokenSelected: (tokenAddress: string) => void
  onClose: () => void
  tokens: TokenBalance[]
  title: string
}

function TokenOption({ tokenInfo, onPress }: { tokenInfo: TokenBalance; onPress: () => void }) {
  return (
    <Touchable onPress={onPress} testID={`${tokenInfo.symbol}Touchable`}>
      <View style={styles.tokenOptionContainer}>
        <Image source={{ uri: tokenInfo.imageUrl }} style={styles.tokenImage} />
        <View style={styles.tokenNameContainer}>
          <Text style={styles.localBalance}>{tokenInfo.symbol}</Text>
          <Text style={styles.currencyBalance}>{tokenInfo.name}</Text>
        </View>
        <View style={styles.tokenBalanceContainer}>
          <TokenDisplay
            style={styles.localBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenInfo.address}
            showLocalAmount={true}
            testID={`Local${tokenInfo.symbol}Balance`}
          />
          <TokenDisplay
            style={styles.currencyBalance}
            amount={tokenInfo.balance}
            tokenAddress={tokenInfo.address}
            showLocalAmount={false}
            testID={`${tokenInfo.symbol}Balance`}
          />
        </View>
      </View>
    </Touchable>
  )
}
// TODO: In the exchange flow or when requesting a payment, only show CELO & stable tokens.
function TokenBottomSheet({ isVisible, origin, onTokenSelected, onClose, tokens, title }: Props) {
  const onTokenPressed = (tokenAddress: string) => () => {
    ValoraAnalytics.track(SendEvents.token_selected, {
      origin,
      tokenAddress,
    })
    onTokenSelected(tokenAddress)
  }

  const titleComponent = <Text style={styles.title}>{title}</Text>

  return (
    <BottomSheet isVisible={isVisible} onBackgroundPress={onClose} stickyHeader={titleComponent}>
      <>
        {tokens.map((tokenInfo, index) => {
          return (
            <React.Fragment key={`token-${tokenInfo.address}`}>
              {index > 0 && <View style={styles.separator} />}
              <TokenOption tokenInfo={tokenInfo} onPress={onTokenPressed(tokenInfo.address)} />
            </React.Fragment>
          )
        })}
      </>
    </BottomSheet>
  )
}

TokenBottomSheet.navigationOptions = {}

const styles = StyleSheet.create({
  title: {
    ...fontStyles.h2,
  },
  tokenOptionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  tokenImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  tokenNameContainer: {
    flex: 3,
    alignItems: 'flex-start',
    flexShrink: 1,
  },
  tokenBalanceContainer: {
    flex: 2,
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  localBalance: {
    flexShrink: 1,
    ...fontStyles.regular,
  },
  currencyBalance: {
    flexShrink: 1,
    ...fontStyles.small,
    color: colors.gray4,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: colors.gray2,
  },
})

export default TokenBottomSheet
