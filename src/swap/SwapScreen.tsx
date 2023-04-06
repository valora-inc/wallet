import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { SwapScreenSection } from 'src/swap/SwapDrawerScreen'

type Props = NativeStackScreenProps<StackParamList, Screens.SwapScreen>

function SwapScreen(props: Props) {
  return <SwapScreenSection showDrawerTopNav={false} props={props} />
}

export default SwapScreen
