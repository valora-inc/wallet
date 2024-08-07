import { FiatAccountType, KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import KycPending from 'src/fiatconnect/kyc/KycPending'
import getNavigationOptions from 'src/fiatconnect/kyc/getNavigationOptions'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdTokenId, mockFiatConnectQuotes } from 'test/values'

jest.mock('src/analytics/AppAnalytics')
jest.mock('src/fiatconnect/kyc/getNavigationOptions')

describe('KycPending', () => {
  const mockStore = (overrides: any = {}) => {
    const store = createMockStore({
      fiatConnect: {
        ...overrides,
      },
    })
    store.dispatch = jest.fn()
    return store
  }

  const mockQuote = new FiatConnectQuote({
    flow: CICOFlow.CashOut,
    fiatAccountType: FiatAccountType.BankAccount,
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    tokenId: mockCusdTokenId,
  })

  const mockScreenProps = () =>
    getMockStackScreenProps(Screens.KycPending, {
      flow: CICOFlow.CashOut,
      quote: mockQuote,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('sets header options', () => {
    const store = mockStore()
    const mockProps = mockScreenProps()
    render(
      <Provider store={store}>
        <KycPending {...mockProps} />
      </Provider>
    )
    expect(mockProps.navigation.setOptions).toBeCalledWith(
      getNavigationOptions({
        fiatConnectKycStatus: FiatConnectKycStatus.KycPending,
        quote: mockQuote,
      })
    )
  })
  it('pressing close button navigates home', () => {
    const store = mockStore()
    const mockProps = mockScreenProps()
    const { queryByTestId, getByTestId } = render(
      <Provider store={store}>
        <KycPending {...mockProps} />
      </Provider>
    )
    expect(queryByTestId('closeButton')).toBeTruthy()
    fireEvent.press(getByTestId('closeButton'))
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(FiatExchangeEvents.cico_fc_kyc_status_close, {
      provider: mockQuote.getProviderId(),
      flow: CICOFlow.CashOut,
      fiatConnectKycStatus: FiatConnectKycStatus.KycPending,
    })
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(navigateHome).toHaveBeenCalledWith()
  })
})
