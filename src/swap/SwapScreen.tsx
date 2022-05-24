import { take } from 'lodash'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import i18n, { withTranslation } from 'src/i18n'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import variables from 'src/styles/variables'
import ExchangeModal from 'src/swap/ExchangeModal'
import { tokensListSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'

interface OwnProps {}

type Props = WithTranslation & OwnProps

function SwapScreen({ t }: Props) {
  // useBalanceAutoRefresh()
  // @todo get list of tokens from symmetric (name, symbol, address, imgUrl)
  const tokens = useSelector(tokensListSelector)
  const currentTokens = take(tokens, 2)
  const celoBalance = useSelector(celoTokenBalanceSelector)

  const celoBalanceAmount = celoBalance ? { value: celoBalance, currencyCode: Currency.Celo } : null

  return (
    <View style={styles.container} testID={'Swap/Main'}>
      <ExchangeModal defaultInputAsset={null} defaultOutputAsset={null} type={'Swap'} />
    </View>
  )
}

SwapScreen.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: () => <HeaderTitleWithSubtitle title={i18n.t('swap.title')} />,
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    marginVertical: 16,
  },
})

export default withTranslation<Props>()(SwapScreen)
