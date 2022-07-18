import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectTransfers, mockFiatConnectQuotes } from 'test/values'
import { Screens } from 'src/navigator/Screens'
import { fireEvent, render } from '@testing-library/react-native'
import { Provider } from 'react-redux'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import TransferStatusScreen from 'src/fiatconnect/TransferStatusScreen'
import { navigate, navigateBack, navigateHome } from 'src/navigator/NavigationService'
import React from 'react'
import networkConfig from 'src/web3/networkConfig'
import i18n from 'i18next'

describe('TransferStatusScreen', () => {
  const mockStore = (overrides: any = {}) => {
    const store = createMockStore({
      fiatConnect: {
        transfer: mockFiatConnectTransfers[0],
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
    getMockStackScreenProps(Screens.FiatConnectTransferStatus, {
      flow: CICOFlow.CashOut,
      fiatAccount: {
        fiatAccountId: 'some-fiat-account-id',
        accountName: 'some-friendly-name',
        institutionName: 'some-bank',
        fiatAccountType: FiatAccountType.BankAccount,
      },
      normalizedQuote: mockQuote,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('success view', () => {
    it('navigates home on success', () => {
      const store = mockStore()
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('Continue')).toBeTruthy()
      fireEvent.press(getByTestId('Continue'))
      expect(navigateHome).toHaveBeenCalledWith()
    })

    it('shows TX details on Celo Explorer on success', () => {
      const store = mockStore()
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('txDetails')).toBeTruthy()
      fireEvent.press(getByTestId('txDetails'))
      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
        uri: `${networkConfig.celoExplorerBaseTxUrl}${mockFiatConnectTransfers[0].txHash}`,
      })
    })
  })

  describe('failure view', () => {
    it('navigates back when try again button is pressed on failure', () => {
      const store = mockStore({ transfer: mockFiatConnectTransfers[1] })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('TryAgain')).toBeTruthy()
      fireEvent.press(getByTestId('TryAgain'))
      expect(navigateBack).toHaveBeenCalledWith()
    })

    it('navigates to support page when contact support button is pressed on failure', () => {
      const store = mockStore({ transfer: mockFiatConnectTransfers[1] })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('SupportContactLink')).toBeTruthy()
      fireEvent.press(getByTestId('SupportContactLink'))
      expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
        prefilledText: 'fiatConnectStatusScreen.requestNotCompleted.contactSupportPrefill',
      })
    })
  })
})
