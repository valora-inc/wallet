import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { SwapScreenSection } from 'src/swap/SwapScreen'

type Props = NativeStackScreenProps<StackParamList, Screens.SwapActionScreen>

function SwapActionScreen(props: Props) {
  return <SwapScreenSection showDrawerTopNav={false} props={props} />
}

export default SwapActionScreen
