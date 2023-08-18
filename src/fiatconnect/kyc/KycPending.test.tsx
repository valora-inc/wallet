import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { mockFiatConnectQuotes } from 'test/values'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { Screens } from 'src/navigator/Screens'
import { Provider } from 'react-redux'
import KycPending from 'src/fiatconnect/kyc/KycPending'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import getNavigationOptions from 'src/fiatconnect/kyc/getNavigationOptions'
import { KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { navigateHome } from 'src/navigator/NavigationService'
import { FiatExchangeEvents } from 'src/analytics/Events'

jest.mock('src/analytics/ValoraAnalytics')
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
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      FiatExchangeEvents.cico_fc_kyc_status_close,
      {
        provider: mockQuote.getProviderId(),
        flow: CICOFlow.CashOut,
        fiatConnectKycStatus: FiatConnectKycStatus.KycPending,
      }
    )
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(navigateHome).toHaveBeenCalledWith()
  })
})
