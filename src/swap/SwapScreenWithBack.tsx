import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { SwapScreenSection } from 'src/swap/SwapScreen'

type Props = NativeStackScreenProps<StackParamList, Screens.SwapScreenWithBack>

function SwapScreenWithBack({ navigation }: Props) {
  return <SwapScreenSection showDrawerTopNav={false} backNavigator={navigation} />
}

export default SwapScreenWithBack
