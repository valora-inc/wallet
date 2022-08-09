import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import SwapIcon from 'src/icons/SwapIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenExchange } from 'src/transactions/types'

interface Props {
  exchange: TokenExchange
}

function SwapFeedItem({ exchange }: Props) {
  const { t } = useTranslation()
  const incomingTokenInfo = useTokenInfo(exchange.inAmount.tokenAddress)
  const outgoingTokenInfo = useTokenInfo(exchange.outAmount.tokenAddress)

  const openTransferDetails = () => {
    navigate(Screens.TransactionDetailsScreen, { transaction: exchange })
  }

  return (
    <Touchable disabled={false} onPress={openTransferDetails}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <SwapIcon />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} testID={'SwapFeedItem/title'}>
              {t('swapScreen.title')}
            </Text>
            <TokenDisplay
              amount={exchange.inAmount.value}
              tokenAddress={exchange.inAmount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              showExplicitPositiveSign={true}
              hideSign={false}
              style={[styles.amount, { color: colors.greenUI }]}
              testID={'SwapFeedItem/incomingAmount'}
            />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.subtitle} testID={'SwapFeedItem/subtitle'}>
              {outgoingTokenInfo?.symbol} {'to'} {incomingTokenInfo?.symbol}
            </Text>
            <TokenDisplay
              amount={-exchange.outAmount.value}
              tokenAddress={exchange.outAmount.tokenAddress}
              showLocalAmount={false}
              showSymbol={true}
              hideSign={false}
              style={styles.tokenAmount}
              testID={'SwapFeedItem/outgoingAmount'}
            />
          </View>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: variables.contentPadding,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: -1,
  },
  title: {
    ...fontStyles.regular500,
    flexShrink: 1,
  },
  subtitle: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
  },
  amount: {
    ...fontStyles.regular500,
    marginLeft: 'auto',
    paddingLeft: 10,
    minWidth: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  tokenAmount: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 2,
    paddingLeft: 10,
    marginLeft: 'auto',
    minWidth: '40%',
    textAlign: 'right',
    flexWrap: 'wrap',
  },
})

export default SwapFeedItem
