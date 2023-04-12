import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import SwapScreenWithBack from 'src/swap/SwapScreenWithBack'
import { createMockStore } from 'test/utils'
import { mockNavigation } from 'test/values'

describe('SwapScreen', () => {
  it('SwapScreenWithBack component renders the back button', () => {
    const mockProps = { navigation: mockNavigation } as NativeStackScreenProps<
      StackParamList,
      Screens.SwapScreenWithBack
    >
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>{SwapScreenWithBack(mockProps)}</Provider>
    )

    expect(queryByTestId('SwapScreen/DrawerBar')).toBeFalsy()
    expect(mockProps.navigation.setOptions).toHaveBeenCalled()
  })
})
