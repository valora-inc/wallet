import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { SupportedActions } from 'src/walletConnect/constants'
import ActionRequest from 'src/walletConnect/screens/ActionRequest'
import { createMockStore } from 'test/utils'

describe('ActionRequest', () => {
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

  afterEach(() => {
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
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest pendingAction={{ action, peerId }} />
        </Provider>
      )

      expect(getByText('confirmTransaction, {"dappName":"WalletConnect Example"}')).toBeTruthy()
      expect(getByText('action.askingV1_35, {"dappName":"WalletConnect Example"}')).toBeTruthy()
      expect(getByText('action.sign')).toBeTruthy()
      expect(getByText('allow')).toBeTruthy()
      expect(getByText('cancel')).toBeTruthy()
    })

    it('shows request details with correct string on clicking details', async () => {
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest pendingAction={{ action, peerId }} />
        </Provider>
      )
      await fireEvent.press(getByText('action.details'))
      expect(getByText('Message to sign')).toBeTruthy()
    })

    it('shows request details with raw string if message cannot be decoded', async () => {
      action.params[0] = 'invalid hex'
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest pendingAction={{ action, peerId }} />
        </Provider>
      )
      await fireEvent.press(getByText('action.details'))
      expect(getByText('invalid hex')).toBeTruthy()
    })

    it('shows request details with empty message', async () => {
      action.params[0] = ''
      const { getByText } = render(
        <Provider store={store}>
          <ActionRequest pendingAction={{ action, peerId }} />
        </Provider>
      )
      await fireEvent.press(getByText('action.details'))
      expect(getByText('action.emptyMessage')).toBeTruthy()
    })
  })
})
