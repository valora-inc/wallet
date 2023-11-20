import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { SwapEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
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
      const swapStart = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(swapStart.getByTestId('GreenLoadingSpinner')).toBeTruthy()
      expect(swapStart.getByText('SwapExecuteScreen.swapPending')).toBeTruthy()
      expect(swapStart.getByText('SwapExecuteScreen.exchangeRateSubtext')).toBeTruthy()
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
      expect(getByTestId('GreenLoadingSpinner')).toBeTruthy()
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
      expect(getByTestId('GreenLoadingSpinner')).toBeTruthy()
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

      expect(getByTestId('RedLoadingSpinnerToInfo')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapErrorSection.title')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapErrorSection.subtitle')).toBeTruthy()
      expect(getByTestId('ContactSupportTouchable')).toBeTruthy()
    })

    it("should navigate to contact support on tap of 'Contact Support' touchable", () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.ERROR,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )

      fireEvent.press(getByTestId('ContactSupportTouchable'))
      expect(navigate).toHaveBeenCalledWith(Screens.SupportContact)
    })

    it("should navigate to swap review on tap of 'Try Again'", () => {
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

      fireEvent.press(getByText('SwapExecuteScreen.swapActionBar.tryAgain'))
      expect(navigateBack).toHaveBeenCalled()
    })

    it("should navigate to home on tap of 'Done'", () => {
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

      fireEvent.press(getByText('SwapExecuteScreen.swapActionBar.done'))
      expect(navigateHome).toHaveBeenCalled()
    })
  })

  describe('Swap.PRICE_CHANGE', () => {
    it('should display modal if swap state is Swap.PRICE_CHANGE', () => {
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
      expect(getByTestId('RedLoadingSpinnerToInfo')).toBeTruthy()
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
      expect(navigateBack).toHaveBeenCalled()
    })
  })

  describe('SWAP.COMPLETE', () => {
    it('should display correctly if swap state is SWAP.COMPLETE', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.COMPLETE,
        },
      })
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <SwapExecuteScreen />
        </Provider>
      )
      expect(getByTestId('GreenLoadingSpinnerToCheck')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapCompleteSection.title')).toBeTruthy()
      expect(getByText('SwapExecuteScreen.swapCompleteSection.subtitle')).toBeTruthy()
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
    fireEvent.press(getByText('SwapExecuteScreen.swapActionBar.swapAgain'))
    expect(navigateBack).toHaveBeenCalled()
  })

  it("should be able to navigate home on press of 'Done'", () => {
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
    fireEvent.press(getByText('SwapExecuteScreen.swapActionBar.done'))
    expect(navigateHome).toHaveBeenCalled()
  })

  it("should emit a correct analytics event on press 'Swap Again' after a successful swap", () => {
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
    fireEvent.press(getByText('SwapExecuteScreen.swapActionBar.swapAgain'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_again)
  })

  it("should emit a correct analytics event on press 'Try Again' after a failed swap", () => {
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
    fireEvent.press(getByText('SwapExecuteScreen.swapActionBar.tryAgain'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(SwapEvents.swap_try_again)
  })
})
