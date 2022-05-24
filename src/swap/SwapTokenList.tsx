import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { WithTranslation } from 'react-i18next'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withTranslation } from 'src/i18n'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TokenListItem from 'src/swap/TokenListItem'
import { SwapDirection } from 'src/swap/types'
import { e2eTokens } from 'src/tokens/e2eTokens'

type OwnProps = {
  direction: SwapDirection
}

type ScreenProps = OwnProps & StackScreenProps<StackParamList, Screens.SwapTokenList>

type Props = ScreenProps & WithTranslation

const SwapTokenList = ({ direction }: Props) => {
  // @todo Replace this; get an actual list of all tokens
  const tokens = Object.entries(e2eTokens())

  const selectToken = (payload: string) => {
    // @todo Navigate to swap and set the tokens to be used.
    navigate(Screens.Swap)
  }

  const Tokens = () =>
    tokens.map((token, index) => {
      const [addr, info] = token
      return <TokenListItem token={info} onClick={selectToken} />
    })

  return <SafeAreaView>{tokens ? Tokens() : null}</SafeAreaView>
}

SwapTokenList.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: () => <HeaderTitleWithSubtitle title={'Choose a Token'} />,
  }
}

export default withTranslation<Props>()(SwapTokenList)
