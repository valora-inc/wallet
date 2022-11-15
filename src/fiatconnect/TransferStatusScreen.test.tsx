import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import TransferStatusScreen from 'src/fiatconnect/TransferStatusScreen'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockFiatConnectQuotes, mockFiatConnectTransfers } from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

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
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        providerId: mockQuote.getProviderId(),
      },
      normalizedQuote: mockQuote,
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('success view', () => {
    it('sets header options', () => {
      const store = mockStore()
      const mockProps = mockScreenProps()
      render(
        <Provider store={store}>
          <TransferStatusScreen {...mockProps} />
        </Provider>
      )
      expect(mockProps.navigation.setOptions).toBeCalledWith(
        expect.objectContaining({
          headerTitle: 'fiatConnectStatusScreen.withdraw.success.header',
        })
      )
    })
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
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_success_complete,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
          txHash: '0xc7a9b0f4354e6279cb476d4c91d5bbc5db6ad29aa8611408de7aee6d2e7fe7c72',
        }
      )
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
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_success_view_tx,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
          txHash: '0xc7a9b0f4354e6279cb476d4c91d5bbc5db6ad29aa8611408de7aee6d2e7fe7c72',
        }
      )
    })
  })

  describe('failure view', () => {
    it('sets header options', () => {
      const store = mockStore({ transfer: mockFiatConnectTransfers[1] })
      const mockProps = mockScreenProps()
      render(
        <Provider store={store}>
          <TransferStatusScreen {...mockProps} />
        </Provider>
      )
      expect(mockProps.navigation.setOptions).toBeCalledWith(
        expect.objectContaining({
          headerLeft: expect.any(Function),
          headerRight: expect.any(Function),
        })
      )
    })
    it('navigates to review screen when try again button is pressed on failure', () => {
      const store = mockStore({ transfer: mockFiatConnectTransfers[1] })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps()} />
        </Provider>
      )
      expect(queryByTestId('TryAgain')).toBeTruthy()
      fireEvent.press(getByTestId('TryAgain'))
      expect(navigate).toHaveBeenCalledWith(Screens.FiatConnectReview, {
        flow: CICOFlow.CashOut,
        fiatAccount: {
          fiatAccountId: 'some-fiat-account-id',
          accountName: 'some-friendly-name',
          institutionName: 'some-bank',
          fiatAccountType: FiatAccountType.BankAccount,
          fiatAccountSchema: FiatAccountSchema.AccountNumber,
          providerId: mockQuote.getProviderId(),
        },
        normalizedQuote: mockQuote,
        shouldRefetchQuote: true,
      })
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_error_retry,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
        }
      )
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
      expect(ValoraAnalytics.track).toHaveBeenCalledTimes(1)
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_error_contact_support,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
        }
      )
    })
  })
})
