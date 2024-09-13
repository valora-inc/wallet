import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import JumpstartIntro from 'src/jumpstart/JumpstartIntro'
import { navigate } from 'src/navigator/NavigationService'
import { getDynamicConfigParams } from 'src/statsig'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig')

jest.mocked(getDynamicConfigParams).mockReturnValue({
  wallet_network_timeout_seconds: 10,
  jumpstartContracts: [],
})

describe('JumpstartIntro', () => {
  it('should render the correct actions and components', () => {
    const { getByText, queryByText, getByTestId } = render(
      <Provider
        store={createMockStore({
          app: {
            showSwapMenuInDrawerMenu: false,
          },
        })}
      >
        <JumpstartIntro />
      </Provider>
    )

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.noFundsHint')).toBeTruthy()
    expect(getByText('jumpstartIntro.addFundsCelo.cta')).toBeTruthy()
    expect(getByTestId('JumpstartIntro/noFundsButton')).toBeTruthy()

    expect(getByText('addFundsActions.transfer')).toBeTruthy()
    expect(queryByText('addFundsActions.swap')).toBeFalsy()
    expect(getByText('addFundsActions.add')).toBeTruthy()
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
        <JumpstartIntro />
      </Provider>
    )

    fireEvent.press(getByText('addFundsActions.add'))
    expect(navigate).toHaveBeenLastCalledWith('FiatExchangeCurrencyBottomSheet', {
      flow: 'CashIn',
      networkId: 'celo-alfajores',
    })

    fireEvent.press(getByText('addFundsActions.transfer'))
    expect(navigate).toHaveBeenLastCalledWith('ExchangeQR', {
      flow: 'CashIn',
    })

    fireEvent.press(getByText('addFundsActions.swap'))
    expect(navigate).toHaveBeenLastCalledWith('SwapScreenWithBack', {
      toTokenNetworkId: 'celo-alfajores',
    })
  })
})
