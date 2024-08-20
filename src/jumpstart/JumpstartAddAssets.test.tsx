import { fireEvent, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock'
import React from 'react'
import { Provider } from 'react-redux'
import JumpstartAddAssets from 'src/jumpstart/JumpstartAddAssets'
import { navigate } from 'src/navigator/NavigationService'
import { getDynamicConfigParams } from 'src/statsig'
import { createMockStore } from 'test/utils'

const mockFetch = fetch as FetchMock
jest.mock('src/statsig')

jest.mocked(getDynamicConfigParams).mockReturnValue({
  wallet_network_timeout_seconds: 10,
})

describe('JumpstartAddAssets', () => {
  it('should render the correct actions and components', async () => {
    const { getByText, findByText, queryByText } = render(
      <Provider
        store={createMockStore({
          app: {
            showSwapMenuInDrawerMenu: false,
          },
        })}
      >
        <JumpstartAddAssets />
      </Provider>
    )

    expect(await findByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.addFundsCelo.info')).toBeTruthy()
    expect(getByText('jumpstartIntro.addFundsCelo.cta')).toBeTruthy()

    expect(getByText('earnFlow.addCryptoBottomSheet.actions.transfer')).toBeTruthy()
    expect(queryByText('earnFlow.addCryptoBottomSheet.actions.swap')).toBeFalsy()
    expect(getByText('earnFlow.addCryptoBottomSheet.actions.add')).toBeTruthy()
  })

  it('should trigger the expected callbacks on press actions', async () => {
    const mockExchanges = [{ name: 'some exchange', link: 'some link' }]
    mockFetch.mockResponseOnce(JSON.stringify(mockExchanges))

    const { getByText, findByText } = render(
      <Provider
        store={createMockStore({
          app: {
            showSwapMenuInDrawerMenu: true,
          },
        })}
      >
        <JumpstartAddAssets />
      </Provider>
    )

    fireEvent.press(await findByText('earnFlow.addCryptoBottomSheet.actions.add'))
    expect(navigate).toHaveBeenLastCalledWith('FiatExchangeCurrencyBottomSheet', {
      flow: 'CashIn',
      networkId: 'celo-alfajores',
    })

    fireEvent.press(getByText('earnFlow.addCryptoBottomSheet.actions.transfer'))
    expect(navigate).toHaveBeenLastCalledWith('ExchangeQR', {
      flow: 'CashIn',
      exchanges: mockExchanges,
    })

    fireEvent.press(getByText('earnFlow.addCryptoBottomSheet.actions.swap'))
    expect(navigate).toHaveBeenLastCalledWith('SwapScreenWithBack', {
      toTokenNetworkId: 'celo-alfajores',
    })
  })
})
