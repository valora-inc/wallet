import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-test-renderer'
import SwapScreen from 'src/swap/SwapScreen'
import { createMockStore } from 'test/utils'

const defaultStore = {
  tokens: {
    tokenBalances: {
      '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f': {
        address: '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f',
        symbol: 'cEUR',
        priceFetchedAt: 1658144640753,
        historicalUsdPrices: {
          lastDay: {
            at: 1658057880747,
            priceAt: 1646257402384,
            price: '5.03655958698530226301',
          },
        },
        usdPrice: '5.03655958698530226301',
        decimals: 18,
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cEUR.png',
        isCoreToken: true,
        isSupercharged: true,
        name: 'Celo Euro',
        balance: '0.194944901630611111',
      },
      '0x874069fa1eb16d44d622f2e0ca25eea172369bc1': {
        usdPrice: '1',
        isCoreToken: true,
        address: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
        priceFetchedAt: 1658144640753,
        symbol: 'cUSD',
        last24hoursPrice: '1',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/cUSD.png',
        decimals: 18,
        balance: '0.2',
        historicalUsdPrices: {
          lastDay: {
            at: 1658057880747,
            priceAt: 1646257402384,
            price: '1',
          },
        },
        isSupercharged: true,
        name: 'Celo Dollar',
      },
      '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9': {
        address: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
        symbol: 'CELO',
        priceFetchedAt: 1658144640753,
        historicalUsdPrices: {
          lastDay: {
            at: 1658057880747,
            price: '13.05584965485329753569',
          },
        },
        usdPrice: '13.05584965485329753569',
        decimals: 18,
        last24hoursPrice: '14',
        imageUrl:
          'https://raw.githubusercontent.com/valora-inc/address-metadata/main/assets/tokens/CELO.png',
        isCoreToken: true,
        name: 'Celo native asset',
        balance: '0',
      },
    },
  },
}

const renderScreen = () => {
  const store = createMockStore(defaultStore)
  const tree = render(
    <Provider store={store}>
      <SwapScreen />
    </Provider>
  )
  const [swapFromContainer, swapToContainer] = tree.getAllByTestId('SwapAmountInput')

  return {
    ...tree,
    swapFromContainer,
    swapToContainer,
  }
}

describe('SwapScreen', () => {
  it('should display the correct elements on load', () => {
    const { getByText, swapFromContainer, swapToContainer } = renderScreen()

    expect(getByText('swapScreen.title')).toBeTruthy()
    expect(getByText('swapScreen.review')).toBeDisabled()

    expect(within(swapFromContainer).getByText('swapScreen.swapFrom')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/MaxButton')).toBeTruthy()
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()

    expect(within(swapToContainer).getByText('swapScreen.swapTo')).toBeTruthy()
    expect(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()
  })

  it('should allow selecting tokens', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen()

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()

    void act(() => {
      fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runAllTimers()
      fireEvent.press(getByTestId('cEURTouchable'))

      fireEvent.press(within(swapToContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runAllTimers()
      fireEvent.press(getByTestId('CELOTouchable'))
    })

    expect(within(swapFromContainer).getByText('cEUR')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should swap the to/from tokens if the same token is selected', () => {
    const { swapFromContainer, swapToContainer, getByTestId } = renderScreen()

    expect(within(swapFromContainer).getByText('CELO')).toBeTruthy()
    expect(within(swapToContainer).getByText('cUSD')).toBeTruthy()

    void act(() => {
      fireEvent.press(within(swapFromContainer).getByTestId('SwapAmountInput/TokenSelect'))
      jest.runAllTimers()
      fireEvent.press(getByTestId('cUSDTouchable'))
    })

    expect(within(swapFromContainer).getByText('cUSD')).toBeTruthy()
    expect(within(swapToContainer).getByText('CELO')).toBeTruthy()
  })

  it('should keep the to amount in sync with the exchange rate', () => {
    const { swapFromContainer, swapToContainer, getByText } = renderScreen()

    void act(() => {
      fireEvent.changeText(within(swapFromContainer).getByTestId('SwapAmountInput/Input'), '1.234')
      jest.runAllTimers()
    })

    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1.234')
    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('4.10305')
    expect(getByText('swapScreen.review')).not.toBeDisabled()
  })

  it('should keep the from amount in sync with the exchange rate', () => {
    const { swapFromContainer, swapToContainer } = renderScreen()

    void act(() => {
      fireEvent.changeText(within(swapToContainer).getByTestId('SwapAmountInput/Input'), '3.325')
      jest.runAllTimers()
    })

    expect(within(swapToContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('3.325')
    expect(within(swapFromContainer).getByTestId('SwapAmountInput/Input').props.value).toBe('1')
  })
})
