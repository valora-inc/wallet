import Clipboard from '@react-native-clipboard/clipboard'
import { fireEvent, render, within } from '@testing-library/react-native'
import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { ActiveDapp, DappSection } from 'src/dapps/types'
import { SupportedActions } from 'src/walletConnect/constants'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import {
  acceptRequest as acceptRequestV1,
  denyRequest as denyRequestV1,
} from 'src/walletConnect/v1/actions'
import {
  acceptRequest as acceptRequestV2,
  denyRequest as denyRequestV2,
} from 'src/walletConnect/v2/actions'
import { createMockStore } from 'test/utils'

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
}))

describe('ActionRequest with WalletConnect V1', () => {
  const peerId = 'c49968fd-9607-4a43-ac66-703402400ffa'
  const store = createMockStore({
    walletConnect: {
      v1: {
        sessions: [
          {
            bridge: 'https://t.bridge.walletconnect.org',
            clientMeta: {
              url: 'https://valoraapp.com/',
              name: 'Valora',
              description: 'A mobile payments wallet that works worldwide',
              icons: ['https://valoraapp.com//favicon.ico'],
            },
            peerId: 'c49968fd-9607-4a43-ac66-703402400ffa',
            accounts: ['0x4ecadc898984191949aeedafe7248ebc2e276a71'],
            chainId: 44787,
            handshakeTopic: '70af5154-38fd-49a3-81b1-41386a0b065f',
            connected: true,
            clientId: 'd4c7cb51-5856-4233-afc2-7b70f697101e',
            key: 'db6d54e8d53fc6fd64a1c15c1dd480449f07c2d435ad0c375cb58f7afab7e83c',
            handshakeId: 1654504215867825,
            peerMeta: {
              url: 'https://celo-walletconnect.vercel.app',
              icons: ['https://celo-walletconnect.vercel.app/favicon.ico'],
              description: '',
              name: 'WalletConnect Example',
            },
          },
        ],
      },
    },
  })

  beforeEach(() => {
    store.clearActions()
  })

  describe('personal_sign', () => {
    const action = {
      id: 1,
      jsonrpc: '',
      method: SupportedActions.personal_sign,
      params: [
        '0x4d65737361676520746f207369676e', // hex of 'Message to sign'
        '0xe17becad62a0a1225473bb52e620ae29728b55a0',
      ],
    }
    it('renders the correct elements', () => {
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={1} pendingAction={{ action, peerId }} />
        </Provider>
      )

      expect(getByText('confirmTransaction')).toBeTruthy()
      expect(
        getByText('walletConnectRequest.signPayload, {"dappName":"WalletConnect Example"}')
      ).toBeTruthy()
      expect(getByText('allow')).toBeTruthy()
      expect(
        within(getByTestId('WalletConnectActionRequest/RequestPayload')).getByText(
          'Message to sign'
        )
      ).toBeTruthy()
    })

    it('shows request details with raw string if message cannot be decoded', () => {
      action.params[0] = 'invalid hex'
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={1} pendingAction={{ action, peerId }} />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectActionRequest/RequestPayload')).getByText('invalid hex')
      ).toBeTruthy()
    })

    it('shows request details with empty message', () => {
      action.params[0] = ''
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={1} pendingAction={{ action, peerId }} />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectActionRequest/RequestPayload')).getByText(
          'action.emptyMessage'
        )
      ).toBeTruthy()
    })

    it('dispatches the correct action on press allow', () => {
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest version={1} pendingAction={{ action, peerId }} />
        </Provider>
      )

      fireEvent.press(getByText('allow'))
      expect(store.getActions()).toEqual([acceptRequestV1(peerId, action)])
    })

    it('dispatches the correct action on dismiss bottom sheet', () => {
      const { unmount } = render(
        <Provider store={store}>
          <ActionRequest version={1} pendingAction={{ action, peerId }} />
        </Provider>
      )

      unmount()
      expect(store.getActions()).toEqual([denyRequestV1(peerId, action, 'User denied')])
    })
  })
})

describe('ActionRequest with WalletConnect V2', () => {
  const v2Session: SessionTypes.Struct = {
    expiry: 1670411909,
    self: {
      metadata: {
        icons: ['https://valoraapp.com//favicon.ico'],
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
  }

  const pendingAction: SignClientTypes.EventArguments['session_request'] = {
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
  }

  describe('personal_sign', () => {
    const store = createMockStore({
      walletConnect: {
        v2: {
          sessions: [v2Session],
        },
      },
      dapps: {
        dappsMinimalDisclaimerEnabled: true,
      },
    })

    beforeEach(() => {
      store.clearActions()
    })

    it('renders the correct elements', () => {
      const { getByText, getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      expect(getByText('confirmTransaction')).toBeTruthy()
      expect(
        getByText('walletConnectRequest.signPayload, {"dappName":"WalletConnect Example"}')
      ).toBeTruthy()
      expect(getByText('allow')).toBeTruthy()
      expect(
        within(getByTestId('WalletConnectActionRequest/RequestPayload')).getByText(
          'Message to sign'
        )
      ).toBeTruthy()
      expect(getByText('dappsDisclaimerUnlistedDapp')).toBeTruthy()
    })

    it('copies the request payload', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      fireEvent.press(getByTestId('WalletConnectActionRequest/RequestPayload/Copy'))
      expect(Clipboard.setString).toHaveBeenCalledWith('Message to sign')
    })

    it('shows request details with raw string if message cannot be decoded', () => {
      pendingAction.params.request.params[0] = 'invalid hex'
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectActionRequest/RequestPayload')).getByText('invalid hex')
      ).toBeTruthy()
    })

    it('shows request details with empty message', () => {
      pendingAction.params.request.params[0] = ''
      const { getByTestId } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      expect(
        within(getByTestId('WalletConnectActionRequest/RequestPayload')).getByText(
          'action.emptyMessage'
        )
      ).toBeTruthy()
    })

    it('dispatches the correct action on press allow', () => {
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      fireEvent.press(getByText('allow'))
      expect(store.getActions()).toEqual([acceptRequestV2(pendingAction)])
    })

    it('dispatches the correct action on dismiss bottom sheet', () => {
      const { unmount } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      unmount()
      expect(store.getActions()).toEqual([
        denyRequestV2(pendingAction, getSdkError('USER_REJECTED')),
      ])
    })
  })

  describe('displayed dapp name falbacks', () => {
    const activeDapp: ActiveDapp = {
      id: 'someDappId',
      categoryId: 'someCategory',
      iconUrl: '',
      name: 'someDappName',
      description: '',
      dappUrl: 'https://react-app.walletconnect.com',
      isFeatured: false,
      openedFrom: DappSection.All,
    }

    it('should use the name from activeDapp if the request domain matches', () => {
      const store = createMockStore({
        dapps: {
          dappsWebViewEnabled: true,
          activeDapp,
        },
        walletConnect: {
          v2: {
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
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      expect(getByText('confirmTransaction')).toBeTruthy()
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
          v2: {
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
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      expect(getByText('confirmTransaction')).toBeTruthy()
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
          v2: {
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
        },
      })

      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest version={2} pendingAction={pendingAction} />
        </Provider>
      )

      expect(getByText('confirmTransaction')).toBeTruthy()
      expect(getByText('walletConnectRequest.signPayload, {"dappName":""}')).toBeTruthy()
    })
  })
})
