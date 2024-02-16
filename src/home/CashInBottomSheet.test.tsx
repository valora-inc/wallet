import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import { createMockStore } from 'test/utils'

const mockRampProvider = {
  name: 'Ramp',
  restricted: false,
  paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
  url: 'www.fakewebsite.com',
  logo: 'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
  quote: [
    { paymentMethod: PaymentMethod.Card, digitalAsset: 'cusd', returnedAmount: 100, fiatFee: 0 },
  ],
  cashIn: true,
  cashOut: false,
  unavailable: false,
}

const mockRampProviderUnavailable = {
  ...mockRampProvider,
  unavailable: true,
}

const mockRampProviderRestricted = {
  ...mockRampProvider,
  restricted: true,
}

const mockRampProviderNoCashIn = {
  ...mockRampProvider,
  cashIn: false,
}

describe('CashInBottomSheet', () => {
  const mockFetch = fetch as FetchMock

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()
  })

  it('renders correctly', () => {
    const tree = render(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to the add funds page when the add funds button is clicked', async () => {
    mockFetch.mockResponse(JSON.stringify([mockRampProvider]))
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByTestId('cashInBtn')).toBeTruthy())

    fireEvent.press(getByTestId('cashInBtn'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrencyBottomSheet, {
      flow: FiatExchangeFlow.CashIn,
    })
  })

  it.each`
    rampCondition                                | providerResponse                 | rampCashInButtonExpEnabled
    ${'does not have cash in'}                   | ${[mockRampProviderNoCashIn]}    | ${true}
    ${'is restricted'}                           | ${[mockRampProviderRestricted]}  | ${true}
    ${'is unavailable'}                          | ${[mockRampProviderUnavailable]} | ${true}
    ${'is available but experiment is disabled'} | ${[mockRampProvider]}            | ${false}
  `(
    'Regular Version is visible when ramp $rampCondition',
    async ({ providerResponse, rampCashInButtonExpEnabled }) => {
      mockFetch.mockResponse(JSON.stringify(providerResponse))
      const { getByTestId } = render(
        <Provider
          store={createMockStore({
            app: { rampCashInButtonExpEnabled },
          })}
        >
          <CashInBottomSheet />
        </Provider>
      )
      await act(() => {
        jest.runOnlyPendingTimers()
      })

      await waitFor(() => expect(getByTestId('cashInBtn')).toBeTruthy())
    }
  )

  it('Ramp Version: navigates to ramp when add funds button is clicked', async () => {
    mockFetch.mockResponse(JSON.stringify([mockRampProvider]))
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          app: { rampCashInButtonExpEnabled: true },
        })}
      >
        <CashInBottomSheet />
      </Provider>
    )
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    await waitFor(() => expect(getByTestId('cashInBtnRamp')).toBeTruthy())
    fireEvent.press(getByTestId('cashInBtnRamp'))
    expect(navigateToURI).toHaveBeenCalledWith(mockRampProvider.url)
  })
})
