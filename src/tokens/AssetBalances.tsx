import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { View } from 'react-native'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = NativeStackScreenProps<StackParamList, Screens.TokenBalances>

const AssetBalances = (props: Props) => {
  return <View />
}

export default AssetBalances
