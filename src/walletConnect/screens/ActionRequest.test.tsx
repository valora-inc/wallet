import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render, within } from '@testing-library/react-native'
import { SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { ActiveDapp, DappSection } from 'src/dapps/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { SerializableTransactionRequest } from 'src/viem/preparedTransactionSerialization'
import {
  acceptRequest as acceptRequestV2,
  denyRequest as denyRequestV2,
} from 'src/walletConnect/actions'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2 } from 'test/values'

jest.mock('src/statsig')

describe('ActionRequest with WalletConnect V2', () => {
  const v2Session: SessionTypes.Struct = {
    expiry: 1670411909,
    self: {
      metadata: {
        icons: ['https://valoraapp.com/favicon.ico'],
        description: 'A mobile payments wallet that works worldwide',
        name: 'Valora',
        url: 'https://valoraapp.com/',
      },
      publicKey: 'b991206845c62280479fd1f24087e9c6f0df3921b5f9d94f4619fbf995a81149',
    },
    relay: {
      protocol: 'irn',
    },
    peer: {
      metadata: {
        name: 'WalletConnect Example',
        description: '',
        icons: [],
        url: 'https://react-app.walletconnect.com',
      },
      publicKey: '3c78ff702b703e873a90a9619598effa0e3b01deb977cb277d3b0eecff3a0320',
    },
    controller: 'b991206845c62280479fd1f24087e9c6f0df3921b5f9d94f4619fbf995a81149',
    namespaces: {
      eip155: {
        accounts: ['eip155:44787:0x047154ac4d7e01b1dc9ddeea9e8996b57895a747'],
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData',
        ],
        events: ['chainChanged', 'accountsChanged'],
      },
    },
    acknowledged: true,
    topic: 'd8afe1f5c3efa38bbb62c68005f572a7218afcd48703e4b02bdc5df2549ac5b5',
    pairingTopic: '20eca0383221cb6feb7af40d06d5cdd867965dd885e9ad36fb4540d9cc25267b',
    requiredNamespaces: {
      eip155: {
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData',
        ],
        chains: ['eip155:44787'],
        events: ['chainChanged', 'accountsChanged'],
      },
    },
    optionalNamespaces: {},
  }

  const pendingAction: Web3WalletTypes.EventArguments['session_request'] = {
    id: 1669810746892321,
    topic: 'd8afe1f5c3efa38bbb62c68005f572a7218afcd48703e4b02bdc5df2549ac5b5',
    params: {
      chainId: 'eip155:44787',
      request: {
        method: 'personal_sign',
        params: [
          '0x4d65737361676520746f207369676e', // hex of 'Message to sign'
          '0x047154ac4d7e01b1dc9ddeea9e8996b57895a747',
        ],
      },
    },
    verifyContext: {
      verified: {
        origin: '',
        validation: 'UNKNOWN',
        verifyUrl: '',
      },
    },
  }

  const sendTransactionAction = {
    ...pendingAction,
    params: {
      ...pendingAction.params,
      request: {
        ...pendingAction.params.request,
        method: 'eth_sendTransaction',
      },
    },
  }

  const preparedTransaction: SerializableTransactionRequest = {
    from: mockAccount,
    to: mockAccount2,
    data: '0xTEST',
    nonce: 100,
    maxFeePerGas: '12000000000',
    maxPriorityFeePerGas: '2000000000',
    gas: '100000',
  }

  const supportedChains = ['eip155:44787']

  beforeEach(() => {
    jest.mocked(getFeatureGate).mockReset()
  })

  describe('ActionRequest with viem', () => {
    const store = createMockStore({
      walletConnect: {
        sessions: [v2Session],
      },
    })

    beforeEach(() => {
      store.clearActions()
      jest
        .mocked(getFeatureGate)
        .mockImplementation(
          (gate) => gate === StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS
        )
    })

    it('should display a dismiss-only bottom sheet if the user has insufficient gas funds', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={sendTransactionAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={true}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.notEnoughBalanceForGas.title')).toBeTruthy()
      expect(
        getByText(
          'walletConnectRequest.notEnoughBalanceForGas.description, {"feeCurrencies":"CELO"}'
        )
      ).toBeTruthy()
      expect(queryByText('allow')).toBeFalsy()

      fireEvent.press(getByText('dismiss'))
      expect(store.getActions()).toEqual([
        denyRequestV2(sendTransactionAction, getSdkError('USER_REJECTED')),
      ])
    })

    it("should display a dismiss-only bottom sheet if the transaction couldn't be prepared", () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={sendTransactionAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
            preparedTransaction={undefined}
            prepareTransactionErrorMessage="execution reverted"
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.failedToPrepareTransaction.title')).toBeTruthy()
      expect(
        getByText(
          'walletConnectRequest.failedToPrepareTransaction.description, {"errorMessage":"execution reverted"}'
        )
      ).toBeTruthy()
      expect(queryByText('allow')).toBeFalsy()

      fireEvent.press(getByText('dismiss'))
      expect(store.getActions()).toEqual([
        denyRequestV2(sendTransactionAction, getSdkError('USER_REJECTED')),
      ])
    })

    it('should accept the request with the prepared transaction', () => {
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={sendTransactionAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
            preparedTransaction={preparedTransaction}
          />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectRequest/ActionRequestPayload/Value')).getByText(
          JSON.stringify(preparedTransaction)
        )
      ).toBeTruthy()
      expect(
        getByText('walletConnectRequest.estimatedNetworkFee, {"networkName":"Celo Alfajores"}')
      ).toBeTruthy()
      const fee = within(getByTestId('EstimatedNetworkFee'))
      expect(fee.getByText('0.0012 CELO')).toBeTruthy()
      expect(fee.getByText('₱0.008')).toBeTruthy()

      fireEvent.press(getByText('walletConnectRequest.sendTransactionAction'))
      expect(store.getActions()).toEqual([
        acceptRequestV2(sendTransactionAction, preparedTransaction),
      ])
    })
  })

  describe('personal_sign', () => {
    const store = createMockStore({
      walletConnect: {
        sessions: [v2Session],
      },
      dapps: {
        dappsMinimalDisclaimerEnabled: true,
      },
    })

    beforeEach(() => {
      store.clearActions()
    })

    it('renders the correct elements', () => {
      const { getByText, getByTestId, queryByTestId } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.signPayloadTitle')).toBeTruthy()
      expect(
        getByText('walletConnectRequest.signPayload, {"dappName":"WalletConnect Example"}')
      ).toBeTruthy()
      expect(getByText('allow')).toBeTruthy()
      expect(
        within(getByTestId('WalletConnectRequest/ActionRequestPayload/Value')).getByText(
          'Message to sign'
        )
      ).toBeTruthy()
      expect(getByText('dappsDisclaimerUnlistedDapp')).toBeTruthy()
      expect(queryByTestId('EstimatedNetworkFee')).toBeFalsy()
    })

    it('copies the request payload', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      fireEvent.press(getByTestId('WalletConnectRequest/ActionRequestPayload/Copy'))
      expect(Clipboard.setString).toHaveBeenCalledWith('Message to sign')
    })

    it('shows request details with raw string if message cannot be decoded', () => {
      pendingAction.params.request.params[0] = 'invalid hex'
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectRequest/ActionRequestPayload/Value')).getByText(
          'invalid hex'
        )
      ).toBeTruthy()
    })

    it('shows request details with empty message', () => {
      pendingAction.params.request.params[0] = ''
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectRequest/ActionRequestPayload/Value')).getByText(
          'action.emptyMessage'
        )
      ).toBeTruthy()
    })

    it('dispatches the correct action on press allow', () => {
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      fireEvent.press(getByText('allow'))
      expect(store.getActions()).toEqual([acceptRequestV2(pendingAction)])
    })

    it('dispatches the correct action on dismiss bottom sheet', () => {
      const { unmount } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      unmount()
      expect(store.getActions()).toEqual([
        denyRequestV2(pendingAction, getSdkError('USER_REJECTED')),
      ])
    })
  })

  describe('displayed dapp name fallbacks', () => {
    const activeDapp: ActiveDapp = {
      id: 'someDappId',
      categories: ['someCategory'],
      iconUrl: '',
      name: 'someDappName',
      description: '',
      dappUrl: 'https://react-app.walletconnect.com',
      openedFrom: DappSection.All,
    }

    it('should use the name from activeDapp if the request domain matches', () => {
      const store = createMockStore({
        dapps: {
          dappsWebViewEnabled: true,
          activeDapp,
        },
        walletConnect: {
          sessions: [
            {
              ...v2Session,
              peer: {
                metadata: {
                  name: '',
                  description: '',
                  icons: [],
                  url: 'https://react-app.walletconnect.com/somePath',
                },
                publicKey: '',
              },
            },
          ],
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.signPayloadTitle')).toBeTruthy()
      expect(
        getByText('walletConnectRequest.signPayload, {"dappName":"someDappName"}')
      ).toBeTruthy()
    })

    it("should use the payload domain if activeDapp doesn't match", () => {
      const store = createMockStore({
        dapps: {
          dappsWebViewEnabled: true,
          activeDapp,
        },
        walletConnect: {
          sessions: [
            {
              ...v2Session,
              peer: {
                metadata: {
                  name: '',
                  description: '',
                  icons: [],
                  url: 'https://some.dapp.com',
                },
                publicKey: '',
              },
            },
          ],
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.signPayloadTitle')).toBeTruthy()
      expect(
        getByText('walletConnectRequest.signPayload, {"dappName":"some.dapp.com"}')
      ).toBeTruthy()
    })

    it('should display an empty fallback', () => {
      const store = createMockStore({
        dapps: {
          dappsWebViewEnabled: true,
          activeDapp,
        },
        walletConnect: {
          sessions: [
            {
              ...v2Session,
              peer: {
                metadata: {
                  name: '',
                  description: '',
                  icons: [],
                  url: '',
                },
                publicKey: '',
              },
            },
          ],
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={pendingAction}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.signPayloadTitle')).toBeTruthy()
      expect(getByText('walletConnectRequest.signPayload, {"dappName":""}')).toBeTruthy()
    })
  })

  describe('unsupported chain', () => {
    it.each([
      [
        'eth_sendTransaction',
        'walletConnectRequest.sendTransactionTitle',
        'walletConnectRequest.sendDappTransactionUnknownNetwork',
      ],
      [
        'eth_signTransaction',
        'walletConnectRequest.signTransactionTitle',
        'walletConnectRequest.signDappTransactionUnknownNetwork',
      ],
    ])('%s: should show a warning if the chain is not supported', (method, title, description) => {
      const store = createMockStore({
        walletConnect: {
          sessions: [v2Session],
        },
      })

      const { getByText, queryByText, queryByTestId } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={{
              ...pendingAction,
              params: {
                ...pendingAction.params,
                request: {
                  ...pendingAction.params.request,
                  method,
                },
                chainId: 'eip155:123456', // unsupported chain
              },
            }}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText(title)).toBeTruthy()
      expect(getByText(`${description}, {"dappName":"WalletConnect Example"}`)).toBeTruthy()
      expect(queryByText('allow')).toBeFalsy()
      expect(getByText('dismiss')).toBeTruthy()
      expect(
        getByText(
          'walletConnectRequest.unsupportedChain.title, {"dappName":"WalletConnect Example","chainId":"eip155:123456"}'
        )
      ).toBeTruthy()
      expect(queryByTestId('EstimatedNetworkFee')).toBeFalsy()
    })

    it('should not show a warning if the chain is not supported and the method is personal_sign', () => {
      const store = createMockStore({
        walletConnect: {
          sessions: [v2Session],
        },
      })

      const { getByText, queryByText } = render(
        <Provider store={store}>
          <ActionRequest
            version={2}
            pendingAction={{
              ...pendingAction,
              params: {
                ...pendingAction.params,
                request: {
                  ...pendingAction.params.request,
                  method: 'personal_sign',
                },
                chainId: 'eip155:1', // unsupported chain
              },
            }}
            supportedChains={supportedChains}
            hasInsufficientGasFunds={false}
            feeCurrenciesSymbols={['CELO']}
          />
        </Provider>
      )

      expect(getByText('walletConnectRequest.signPayloadTitle')).toBeTruthy()
      expect(
        getByText('walletConnectRequest.signPayload, {"dappName":"WalletConnect Example"}')
      ).toBeTruthy()
      expect(getByText('allow')).toBeTruthy()
      expect(queryByText('dismiss')).toBeFalsy()
      expect(
        queryByText(
          'walletConnectRequest.unsupportedChain.title, {"dappName":"WalletConnect Example","chainId":"eip155:1"}'
        )
      ).toBeFalsy()
    })
  })
})
