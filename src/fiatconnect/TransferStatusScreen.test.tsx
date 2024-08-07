import { FiatAccountSchema, FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-test-renderer'
import { FiatExchangeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { SettlementEstimation, SettlementTime } from 'src/fiatExchanges/quotes/constants'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import TransferStatusScreen from 'src/fiatconnect/TransferStatusScreen'
import { FiatConnectTransfer, SendingTransferStatus } from 'src/fiatconnect/slice'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import appTheme from 'src/styles/appTheme'
import networkConfig, { blockExplorerUrls } from 'src/web3/networkConfig'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdTokenId, mockFiatConnectQuotes } from 'test/values'

jest.mock('src/analytics/AppAnalytics')

const mockTxHash = '0xc7a9b0f4354e6279cb476d4c91d5bbc5db6ad29aa8611408de7aee6d2e7fe7c72'
const mockAddress = '0x123'

describe('TransferStatusScreen', () => {
  const mockStore = (fcTransferOverrides: Partial<FiatConnectTransfer> = {}) => {
    const store = createMockStore({
      fiatConnect: {
        transfer: {
          flow: CICOFlow.CashIn,
          quoteId: 'quote_id',
          status: SendingTransferStatus.Completed,
          txHash: null,
          ...fcTransferOverrides,
        },
      },
      web3: {
        account: mockAddress,
      },
    })
    store.dispatch = jest.fn()
    return store
  }

  const getQuote = (flow: CICOFlow) =>
    new FiatConnectQuote({
      flow,
      fiatAccountType: FiatAccountType.BankAccount,
      quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
      tokenId: mockCusdTokenId,
    })

  const mockScreenProps = (flow: CICOFlow) =>
    getMockStackScreenProps(Screens.FiatConnectTransferStatus, {
      flow,
      fiatAccount: {
        fiatAccountId: 'some-fiat-account-id',
        accountName: 'some-friendly-name',
        institutionName: 'some-bank',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
        providerId: 'provider-two',
      },
      normalizedQuote: getQuote(flow),
    })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('success view', () => {
    it('sets header options', () => {
      const store = mockStore()
      const mockProps = mockScreenProps(CICOFlow.CashOut)
      render(
        <Provider store={store}>
          <TransferStatusScreen {...mockProps} />
        </Provider>
      )
      expect(mockProps.navigation.setOptions).toBeCalledWith(
        expect.objectContaining({
          headerTitle: 'fiatConnectStatusScreen.success.header',
        })
      )
    })
    it('navigates home on success for transfer outs', () => {
      const store = mockStore({ flow: CICOFlow.CashOut, txHash: mockTxHash })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashOut)} />
        </Provider>
      )
      expect(queryByTestId('Continue')).toBeTruthy()
      fireEvent.press(getByTestId('Continue'))
      expect(navigateHome).toHaveBeenCalledWith()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_success_complete,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
          txHash: mockTxHash,
        }
      )
    })

    const lessThanOneHour: SettlementEstimation = {
      settlementTime: SettlementTime.LESS_THAN_ONE_HOUR,
    }
    const lessThan24Hours: SettlementEstimation = {
      settlementTime: SettlementTime.LESS_THAN_X_HOURS,
      upperBound: 24,
    }
    const oneToThreeDays: SettlementEstimation = {
      settlementTime: SettlementTime.X_TO_Y_DAYS,
      lowerBound: 1,
      upperBound: 3,
    }
    it.each([
      [lessThanOneHour, 'descriptionWithin1Hour', ''],
      [lessThan24Hours, 'descriptionWithinXHours', '{"upperBound":24}'],
      [oneToThreeDays, 'descriptionXtoYDays', '{"lowerBound":1,"upperBound":3}'],
    ])(
      'shows appropriate description for settlement time %s',
      (settlementTime, stringSuffix, stringArgs) => {
        const store = mockStore({ flow: CICOFlow.CashOut, txHash: mockTxHash })
        const props = mockScreenProps(CICOFlow.CashOut)
        jest
          .spyOn(props.route.params.normalizedQuote, 'getTimeEstimation')
          .mockReturnValue(settlementTime)
        const { getByText } = render(
          <Provider store={store}>
            <TransferStatusScreen {...props} />
          </Provider>
        )

        const translationKey = `fiatConnectStatusScreen.success.${stringSuffix}`
        const translationKeyAndArgs = stringArgs
          ? `${translationKey}, ${stringArgs}`
          : translationKey
        expect(getByText(translationKeyAndArgs)).toBeTruthy()
      }
    )
    it('shows TX details on Celo Explorer on success for transfer outs', () => {
      const store = mockStore({ flow: CICOFlow.CashOut, txHash: mockTxHash })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashOut)} />
        </Provider>
      )
      expect(queryByTestId('txDetails')).toBeTruthy()
      fireEvent.press(getByTestId('txDetails'))
      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
        uri: new URL(
          mockTxHash,
          blockExplorerUrls[networkConfig.defaultNetworkId].baseTxUrl
        ).toString(),
      })
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_success_view_tx,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
          txHash: mockTxHash,
        }
      )
    })
    it('does not show tx details and navigates home on success for transfer ins', () => {
      const store = mockStore()
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashIn)} />
        </Provider>
      )
      expect(queryByTestId('Continue')).toBeTruthy()
      fireEvent.press(getByTestId('Continue'))
      expect(navigateHome).toHaveBeenCalledWith()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_success_complete,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashIn,
          txHash: null,
        }
      )
      expect(queryByTestId('txDetails')).toBeFalsy()
    })
  })

  describe('tx processing view', () => {
    it('navigates home on clicking continue for transfer outs', () => {
      const store = mockStore({
        status: SendingTransferStatus.TxProcessing,
        flow: CICOFlow.CashOut,
      })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashOut)} />
        </Provider>
      )
      expect(queryByTestId('Continue')).toBeTruthy()
      fireEvent.press(getByTestId('Continue'))
      expect(navigateHome).toHaveBeenCalledWith()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_processing_continue,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
          txHash: null,
        }
      )
    })
    it('shows address page on Celo Explorer for transfer outs', () => {
      const store = mockStore({
        status: SendingTransferStatus.TxProcessing,
        flow: CICOFlow.CashOut,
      })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashOut)} />
        </Provider>
      )
      expect(queryByTestId('txDetails')).toBeTruthy()
      fireEvent.press(getByTestId('txDetails'))
      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
        uri: new URL(
          mockAddress,
          blockExplorerUrls[networkConfig.defaultNetworkId].baseAddressUrl
        ).toString(),
      })
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_processing_view_tx,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
          txHash: null,
        }
      )
    })
    it('does not show celo explorer link and navigates home on continue for transfer ins', () => {
      const store = mockStore({ status: SendingTransferStatus.TxProcessing })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashIn)} />
        </Provider>
      )
      expect(queryByTestId('Continue')).toBeTruthy()
      fireEvent.press(getByTestId('Continue'))
      expect(navigateHome).toHaveBeenCalledWith()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_processing_continue,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashIn,
          txHash: null,
        }
      )
      expect(queryByTestId('txDetails')).toBeFalsy()
    })
  })

  describe('failure view', () => {
    it.each([
      [CICOFlow.CashIn, 'cashIn'],
      [CICOFlow.CashOut, 'cashOut'],
    ])('sets header options for %s', (flow, header) => {
      const store = mockStore({ status: SendingTransferStatus.Failed, flow })
      const mockProps = mockScreenProps(flow)
      let headerRightButton: React.ReactNode
      ;(mockProps.navigation.setOptions as jest.Mock).mockImplementation((options) => {
        headerRightButton = options.headerRight()
      })
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

      const { getByText, getByTestId } = render(
        <Provider store={store}>{headerRightButton}</Provider>
      )
      expect(getByText(`fiatConnectStatusScreen.${header}.cancel`)).toBeTruthy()
      fireEvent.press(getByTestId('Cancel'))
      expect(navigateHome).toHaveBeenCalledWith()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_error_cancel,
        {
          provider: 'provider-two',
          flow,
        }
      )
    })
    it('navigates to review screen when try again button is pressed on failure', () => {
      const store = mockStore({ status: SendingTransferStatus.Failed })
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockScreenProps(CICOFlow.CashOut)} />
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
          providerId: 'provider-two',
        },
        normalizedQuote: getQuote(CICOFlow.CashOut),
        shouldRefetchQuote: true,
      })
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        FiatExchangeEvents.cico_fc_transfer_error_retry,
        {
          provider: 'provider-two',
          flow: CICOFlow.CashOut,
        }
      )
    })
    it.each([
      [CICOFlow.CashIn, 'cashIn'],
      [CICOFlow.CashOut, 'cashOut'],
    ])(
      'navigates to support page when contact support button is pressed on failure for %s',
      (flow, text) => {
        const store = mockStore({ status: SendingTransferStatus.Failed, flow })
        const { queryByTestId, getByTestId } = render(
          <Provider store={store}>
            <TransferStatusScreen {...mockScreenProps(flow)} />
          </Provider>
        )
        expect(queryByTestId('SupportContactLink')).toBeTruthy()
        fireEvent.press(getByTestId('SupportContactLink'))
        expect(navigate).toHaveBeenCalledWith(Screens.SupportContact, {
          prefilledText: `fiatConnectStatusScreen.${text}.contactSupportPrefill`,
        })
        expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
        expect(AppAnalytics.track).toHaveBeenCalledWith(
          FiatExchangeEvents.cico_fc_transfer_error_contact_support,
          {
            provider: 'provider-two',
            flow,
          }
        )
      }
    )
  })

  describe('loading view', () => {
    it('shows loading screen with no headers', () => {
      const mockProps = mockScreenProps(CICOFlow.CashIn)
      const store = mockStore({ status: SendingTransferStatus.Sending })
      const { getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockProps} />
        </Provider>
      )
      expect(getByTestId('loadingTransferStatus')).toBeTruthy()
      expect(mockProps.navigation.setOptions).not.toBeCalled()
    })
    it('Shows explanation if taking a while', async () => {
      const mockProps = mockScreenProps(CICOFlow.CashIn)
      const store = mockStore({ status: SendingTransferStatus.Sending })
      const { getByTestId } = render(
        <Provider store={store}>
          <TransferStatusScreen {...mockProps} />
        </Provider>
      )
      expect(getByTestId('loadingTransferStatus')).toBeTruthy()
      expect(getByTestId('loadingDescription')).toHaveStyle({ color: appTheme.colors.background })
      await act(async () => {
        jest.runOnlyPendingTimers()
      })
      expect(getByTestId('loadingDescription')).toHaveTextContent(
        'fiatConnectStatusScreen.stillProcessing'
      )
      expect(getByTestId('loadingDescription')).toHaveStyle({ color: appTheme.colors.text })
    })
  })
})
