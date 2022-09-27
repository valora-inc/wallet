import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { SwapState } from 'src/swap/slice'
import SwapPending from 'src/swap/SwapPending'
import { createMockStore } from 'test/utils'

describe('SwapPending', () => {
  describe('Swap.START', () => {
    const store = createMockStore({
      swap: {
        swapState: SwapState.START,
      },
    })

    it('should display correctly if swap state is Swap.START', () => {
      const { getByText } = render(
        <Provider store={store}>
          <SwapPending />
        </Provider>
      )
      expect(getByText('swapCompleteScreen.swapPending')).toBeTruthy()
      expect(getByText('swapCompleteScreen.exchangeRateSubtext')).toBeTruthy()
    })
  })

  describe('Swap.APPROVE', () => {
    const store = createMockStore({
      swap: {
        swapState: SwapState.APPROVE,
      },
    })

    it('should display correctly if swap state is Swap.APPROVE', () => {
      const { getByText } = render(
        <Provider store={store}>
          <SwapPending />
        </Provider>
      )
      expect(getByText('swapCompleteScreen.swapPending')).toBeTruthy()
      expect(getByText('swapCompleteScreen.approvingSubtext')).toBeTruthy()
    })
  })

  describe('Swap.EXECUTE', () => {
    it('should display correctly if swap state is Swap.EXECUTE', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.EXECUTE,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <SwapPending />
        </Provider>
      )
      expect(getByText('swapCompleteScreen.swapPending')).toBeTruthy()
      expect(getByText('swapCompleteScreen.completingSubtext')).toBeTruthy()
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
          <SwapPending />
        </Provider>
      )

      expect(getByText('swapCompleteScreen.swapErrorModal.title')).toBeTruthy()
      expect(getByText('swapCompleteScreen.swapErrorModal.action1')).toBeTruthy()
      expect(getByText('swapCompleteScreen.swapErrorModal.action2')).toBeTruthy()
      expect(getByTestId('ErrorModal')).toBeTruthy()
      expect(getByText('swapCompleteScreen.swapErrorModal.body')).toBeTruthy()
    })

    it.todo('should be able to navigate to contact support')
    it.todo('should be able to navigate to swap start')
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
          <SwapPending />
        </Provider>
      )
      expect(getByText('swapCompleteScreen.swapPriceModal.title')).toBeTruthy()
      expect(getByText('swapCompleteScreen.swapPriceModal.action')).toBeTruthy()
      expect(getByTestId('PriceChangeModal')).toBeTruthy()
      expect(getByText('swapCompleteScreen.swapPriceModal.body')).toBeTruthy()
    })

    it.todo('should navigate to swap review on modal dismiss')
    it.todo('should navigate to swap review on background press')
  })

  describe('SWAP.COMPLETE', () => {
    it('should display correctly if swap state is SWAP.COMPLETE', () => {
      const store = createMockStore({
        swap: {
          swapState: SwapState.COMPLETE,
        },
      })
      const { getByText } = render(
        <Provider store={store}>
          <SwapPending />
        </Provider>
      )
      expect(getByText('swapCompleteScreen.swapSuccess')).toBeTruthy()
      expect(getByText('swapCompleteScreen.swapAgain')).toBeTruthy()
    })

    it.todo("should be able to navigate swap start to on press of 'Swap Again'")
  })
})
