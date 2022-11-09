import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { navigate, navigateHome, replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { SwapState } from 'src/swap/slice'
import SwapExecuteScreen from 'src/swap/SwapExecuteScreen'
import { createMockStore } from 'test/utils'

describe('SwapExecuteScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Swap.START', () => {
    const store = createMockStore({
      swap: {
        swapState: SwapState.START,
      },
    })

    it('should display correctly if swap state is Swap.START', () => {
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(getByTestId('SwapExecuteScreen/loadingIcon')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapPending')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.exchangeRateSubtext')).toBeTruthy()
    })
  })

  describe('Swap.APPROVE', () => {
    const store = createMockStore({
      swap: {
        swapState: SwapState.APPROVE,
      },
    })

    it('should display correctly if swap state is Swap.APPROVE', () => {
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(getByTestId('SwapExecuteScreen/loadingIcon')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapPending')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.approvingSubtext')).toBeTruthy()
    })
  })

  describe('Swap.EXECUTE', () => {
    it('should display correctly if swap state is Swap.EXECUTE', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.EXECUTE,
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(getByTestId('SwapExecuteScreen/loadingIcon')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapPending')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.completingSubtext')).toBeTruthy()
    })
  })

  describe('Swap.ERROR', () => {
    it('should display correctly if swap state is Swap.ERROR', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.ERROR,
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )

      expect(getByText('SwapExecuteScreen.swapErrorModal.title')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapErrorModal.swapRestart')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapErrorModal.contactSupport')).toBeTruthy()
      expect(getByTestId('ErrorModal')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapErrorModal.body')).toBeTruthy()
      expect(getByTestId('SwapExecuteScreen/errorIcon')).toBeTruthy()
    })

    it('should be able to navigate to swap start', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.ERROR,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )

      fireEvent.press(getByText('SwapExecuteScreen.swapErrorModal.swapRestart'))
      expect(navigate).toHaveBeenCalledWith(Screens.SwapScreen)
    })

    it('should be able to navigate to contact support', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.ERROR,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )

      fireEvent.press(getByText('SwapExecuteScreen.swapErrorModal.contactSupport'))
      expect(replace).toHaveBeenCalledWith(Screens.SupportContact)
    })
  })

  describe('Swap.PRICE_CHANGE', () => {
    it('should display correctly if swap state is Swap.PRICE_CHANGE', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.PRICE_CHANGE,
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(getByText('SwapExecuteScreen.swapPriceModal.title')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapPriceModal.action')).toBeTruthy()
      expect(getByTestId('PriceChangeModal')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapPriceModal.body')).toBeTruthy()
      expect(getByTestId('SwapExecuteScreen/errorIcon')).toBeTruthy()
    })

    it('should navigate to swap review on modal dismiss', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.PRICE_CHANGE,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      fireEvent.press(getByText('SwapExecuteScreen.swapPriceModal.action'))
      expect(navigate).toHaveBeenCalledWith(Screens.SwapReviewScreen)
    })
  })

  describe('SWAP.COMPLETE', () => {
    it('should display correctly if swap state is SWAP.COMPLETE', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.COMPLETE,
        },
      })
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(getByText('SwapExecuteScreen.swapSuccess')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapAgain')).toBeTruthy()
      expect(getByTestId('ReturnHome')).toBeTruthy()
    })
  })

  it("should be able to navigate swap start to on press of 'Swap Again'", () => {
    const store = createMockStore({
      swap: {
        swapState: SwapState.COMPLETE,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <SwapExecuteScreen />
      </Provider>
    )
    fireEvent.press(getByText('SwapExecuteScreen.swapAgain'))
    expect(navigate).toHaveBeenCalledWith(Screens.SwapScreen)
  })

  it("should be able to navigate home on press of 'X' button", () => {
    const store = createMockStore({
      swap: {
        swapState: SwapState.COMPLETE,
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <SwapExecuteScreen />
      </Provider>
    )
    fireEvent.press(getByTestId('ReturnHome'))
    expect(navigateHome).toHaveBeenCalled()
  })
})
