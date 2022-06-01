import { render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import React from 'react'
import { Provider } from 'react-redux'
import { RootState } from 'src/redux/reducers'
import SwapScreen from 'src/swap/SwapScreen'
import { createMockStore, RecursivePartial } from 'test/utils'

jest.mock('src/swap/ExchangeAssetField', () => 'ExchangeAssetField')
jest.mock('src/swap/TokenSelectionButton', () => 'TokenSelectionButton')
jest.mock('src/swap/SwapTokenList', () => 'SwapTokenList')
jest.mock('src/swap/TokenListItem', () => 'TokenListItem')

const mockSwapState: RecursivePartial<RootState> = {
  swap: {
    currentAssetIn: null,
    currentAssetOut: null,
    isLoading: false,
  },
}

describe('SwapScreen', () => {
  const mockFetch: FetchMock = fetch as FetchMock
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
    mockFetch.mockResponse(
      JSON.stringify({
        data: {
          tokens: [],
        },
      })
    )
  })

  function renderScreen(storeOverride: RecursivePartial<RootState> = {}) {
    const store = createMockStore({
      ...mockSwapState,
      ...storeOverride,
    })

    const tree = render(
      <Provider store={store}>
        <SwapScreen />
      </Provider>
    )

    return { store, tree, ...tree }
  }

  describe('Initial State', () => {
    it.todo("renders correctly on user's first visit")
    it.todo('renders correctly when user only selects asset in')
    it.todo('renders correctly when user only selects asset out')
    it.todo('renders correctly when user selects both assets')
  })

  describe('Subsequent Visits', () => {
    it.todo("renders the user's previously saved swap selections")
  })
})
