import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React, { useRef } from 'react'
import { Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'

type Props = BottomSheetScreenProps<StackParamList, Screens.FiatExchangeCurrencyBottomSheet>

function NetworkMultiSelectBottomSheet({ route }: Props) {
  const ref = useRef<ScrollView>(null)
  return (
    <BottomSheetScrollView forwardedRef={ref} containerStyle={{ padding: undefined }}>
      <Text>Hello world</Text>
    </BottomSheetScrollView>
  )
}

export default NetworkMultiSelectBottomSheet
