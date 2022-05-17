import { fireEvent, render, waitFor } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import { Provider } from 'react-redux'
import CashInBottomSheet from 'src/home/CashInBottomSheet'
import { navigate } from 'src/navigator/NavigationService'
import { navigateToURI } from 'src/utils/linking'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { FiatExchangeFlow, PaymentMethod } from 'src/fiatExchanges/utils'

const mockRampProvider = {
  name: 'Ramp',
  restricted: false,
  paymentMethods: [PaymentMethod.Card, PaymentMethod.Bank],
  url: 'www.fakewebsite.com',
  logo:
    'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
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
    jest.useRealTimers()
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
    const { getByTestId } = render(
      <Provider store={createMockStore({})}>
        <CashInBottomSheet />
      </Provider>
    )

    fireEvent.press(getByTestId('cashInBtn'))
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrency, {
      flow: FiatExchangeFlow.CashIn,
    })
  })
  it('Regular Version is visible when experiment is disabled even if ramp is available', async () => {
    mockFetch.mockResponse(JSON.stringify([mockRampProvider]))
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          app: { rampCashInButtonExpEnabled: false },
        })}
      >
        <CashInBottomSheet />
      </Provider>
    )
    await waitFor(() => expect(getByTestId('cashInBtn')))
  })
  it('Regular Version is visible when ramp is unavailable', async () => {
    mockFetch.mockResponse(JSON.stringify([mockRampProviderUnavailable]))
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          app: { rampCashInButtonExpEnabled: true },
        })}
      >
        <CashInBottomSheet />
      </Provider>
    )
    await waitFor(() => expect(getByTestId('cashInBtn')))
  })
  it('Regular Version is visible when ramp is restricted', async () => {
    mockFetch.mockResponse(JSON.stringify([mockRampProviderRestricted]))
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          app: { rampCashInButtonExpEnabled: true },
        })}
      >
        <CashInBottomSheet />
      </Provider>
    )
    await waitFor(() => expect(getByTestId('cashInBtn')))
  })
  it('Regular Version is visible when ramp does not have cash in', async () => {
    mockFetch.mockResponse(JSON.stringify([mockRampProviderNoCashIn]))
    const { getByTestId } = render(
      <Provider
        store={createMockStore({
          app: { rampCashInButtonExpEnabled: true },
        })}
      >
        <CashInBottomSheet />
      </Provider>
    )
    await waitFor(() => expect(getByTestId('cashInBtn')))
  })
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
    await waitFor(() => expect(getByTestId('cashInBtnRamp')))
    fireEvent.press(getByTestId('cashInBtnRamp'))
    expect(navigateToURI).toHaveBeenCalledWith(mockRampProvider.url)
  })
})
