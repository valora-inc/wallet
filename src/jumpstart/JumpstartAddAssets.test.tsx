import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import JumpstartAddAssets from 'src/jumpstart/JumpstartAddAssets'
import { navigate } from 'src/navigator/NavigationService'
import { getDynamicConfigParams } from 'src/statsig'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

jest.mocked(getDynamicConfigParams).mockReturnValue({
  wallet_network_timeout_seconds: 10,
})

describe('JumpstartAddAssets', () => {
  it('should render the correct actions and components', () => {
    const { getByText, queryByText } = render(
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

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.addFundsCelo.info')).toBeTruthy()
    expect(getByText('jumpstartIntro.addFundsCelo.cta')).toBeTruthy()

    expect(getByText('earnFlow.addCryptoBottomSheet.actions.transfer')).toBeTruthy()
    expect(queryByText('earnFlow.addCryptoBottomSheet.actions.swap')).toBeFalsy()
    expect(getByText('earnFlow.addCryptoBottomSheet.actions.add')).toBeTruthy()
  })

  it('should trigger the expected callbacks on press actions', async () => {
    const { getByText } = render(
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

    fireEvent.press(getByText('earnFlow.addCryptoBottomSheet.actions.add'))
    expect(navigate).toHaveBeenLastCalledWith('FiatExchangeCurrencyBottomSheet', { flow: 'CashIn' })

    fireEvent.press(getByText('earnFlow.addCryptoBottomSheet.actions.transfer'))
    expect(navigate).toHaveBeenLastCalledWith('ExchangeQR', {
      flow: 'CashIn',
    })

    fireEvent.press(getByText('earnFlow.addCryptoBottomSheet.actions.swap'))
    expect(navigate).toHaveBeenLastCalledWith('SwapScreenWithBack')
  })
})
