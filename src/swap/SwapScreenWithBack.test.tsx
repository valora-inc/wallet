import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import SwapScreenWithBack from 'src/swap/SwapScreenWithBack'
import { createMockStore } from 'test/utils'

describe('SwapScreenWithBack', () => {
  it('SwapScreenWithBack component removes the drawer bar', () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>{SwapScreenWithBack()}</Provider>
    )

    expect(queryByTestId('SwapScreen/DrawerBar')).toBeFalsy()
  })
})
