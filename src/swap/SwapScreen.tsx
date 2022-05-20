import { take } from 'lodash'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import i18n, { withTranslation } from 'src/i18n'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { tokensListSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'

interface OwnProps {
  testID: string
}

type Props = WithTranslation & OwnProps

function SwapScreen({ t, testID }: Props) {
  // useBalanceAutoRefresh()
  // @todo get list of tokens from symmetric (name, symbol, address, imgUrl)
  const tokens = useSelector(tokensListSelector)
  const currentTokens = take(tokens, 2)
  const celoBalance = useSelector(celoTokenBalanceSelector)

  const celoBalanceAmount = celoBalance ? { value: celoBalance, currencyCode: Currency.Celo } : null

  return (
    <View style={styles.container} testID={testID}>
      <Text>{JSON.stringify(tokens)}</Text>
      {/* <SwapToken token={currentTokens[0]} />
      <SwapToken token={currentTokens[1]} /> */}
    </View>
  )
}

SwapScreen.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: () => <HeaderTitleWithSubtitle title={i18n.t('swap')} />,
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    marginVertical: 16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: 8,
  },
  balance: {
    ...fontStyles.mediumNumber,
    color: colors.dark,
    marginBottom: 8,
  },
  localBalance: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
})

export default withTranslation<Props>()(SwapScreen)
