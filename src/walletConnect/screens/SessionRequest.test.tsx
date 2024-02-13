import { fireEvent, render } from '@testing-library/react-native'
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { acceptSession, denySession } from 'src/walletConnect/actions'
import { SupportedActions, SupportedEvents } from 'src/walletConnect/constants'
import SessionRequest from 'src/walletConnect/screens/SessionRequest'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

describe(SessionRequest, () => {
  const pendingSession: Web3WalletTypes.EventArguments['session_proposal'] = {
    id: 1690539550772665,
    params: {
      id: 1690539550772665,
      pairingTopic: 'b655eac1cf0cc18780a1c6503d7395f633b3d10791b7a628d9602d10b2fe3f26',
      expiry: 1690539851,
      requiredNamespaces: {
        eip155: {
          methods: ['eth_sendTransaction', 'personal_sign'],
          chains: ['eip155:44787'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
      optionalNamespaces: {},
      relays: [
        {
          protocol: 'irn',
        },
      ],
      proposer: {
        publicKey: 'd0d67fc544702f5b354130b0776801584e8eeabe208ab3e32ad438fd12e6063b',
        metadata: {
          description: 'React App for WalletConnect',
          url: 'https://react-app.walletconnect.com',
          icons: ['https://avatars.githubusercontent.com/u/37784886'],
          name: 'React App',
          verifyUrl: 'https://verify.walletconnect.com',
        },
      },
    },
    verifyContext: {
      verified: {
        verifyUrl: 'https://verify.walletconnect.com',
        validation: 'VALID',
        origin: 'https://react-app.walletconnect.com',
      },
    },
  }

  const namespacesToApprove = buildApprovedNamespaces({
    proposal: pendingSession.params,
    supportedNamespaces: {
      eip155: {
        chains: ['eip155:44787'],
        methods: Object.values(SupportedActions) as string[],
        events: Object.values(SupportedEvents) as string[],
        accounts: [`eip155:44787:${mockAccount}`],
      },
    },
  })

  const supportedChains = ['eip155:44787']

  const store = createMockStore({})

  beforeEach(() => {
    store.clearActions()
  })

  describe('new session', () => {
    it('renders the correct elements', () => {
      const { getByText, queryByText, queryByTestId } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={namespacesToApprove}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      expect(getByText('connectToWallet, {"dappName":"React App"}')).toBeTruthy()
      expect(getByText('shareInfo')).toBeTruthy()
      expect(getByText('walletConnectRequest.connectWalletAction')).toBeTruthy()
      expect(queryByText('dismiss')).toBeFalsy()
      expect(queryByTestId('SessionRequest/NetworkChips')).toHaveTextContent('Celo Alfajores')
      expect(getByText(mockAccount.toLowerCase())).toBeTruthy()
    })

    it('dispatches the correct action on press connect wallet', () => {
      const { getByText } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={namespacesToApprove}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      fireEvent.press(getByText('walletConnectRequest.connectWalletAction'))
      expect(store.getActions()).toEqual([acceptSession(pendingSession, namespacesToApprove)])
    })

    it('dispatches the correct action on dismiss bottom sheet', () => {
      const { unmount } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={namespacesToApprove}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      unmount()
      expect(store.getActions()).toEqual([
        denySession(pendingSession, getSdkError('USER_REJECTED')),
      ])
    })
  })

  describe('no namespace to approve', () => {
    it('should show a warning', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={null}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      expect(getByText('connectToWallet, {"dappName":"React App"}')).toBeTruthy()
      expect(getByText('shareInfo')).toBeTruthy()
      expect(queryByText('allow')).toBeFalsy()
      expect(getByText('dismiss')).toBeTruthy()
      expect(queryByText(mockAccount.toLowerCase())).toBeFalsy()
      expect(
        getByText(
          'walletConnectRequest.session.failUnsupportedNamespace.title, {"dappName":"React App"}'
        )
      ).toBeTruthy()
    })

    it('dispatches the correct action on press dismiss', () => {
      const { getByText } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={null}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      fireEvent.press(getByText('dismiss'))
      expect(store.getActions()).toEqual([
        denySession(pendingSession, getSdkError('UNSUPPORTED_NAMESPACE_KEY')),
      ])
    })
  })

  describe('unsupported chain', () => {
    it('should show a warning', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={{
              ...namespacesToApprove,
              eip155: {
                ...namespacesToApprove.eip155,
                chains: ['eip155:1'],
                accounts: [`eip155:1:${mockAccount}`],
              },
            }}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      expect(getByText('connectToWallet, {"dappName":"React App"}')).toBeTruthy()
      expect(getByText('shareInfo')).toBeTruthy()
      // We still want to allow connection
      expect(getByText('walletConnectRequest.connectWalletAction')).toBeTruthy()
      expect(queryByText('dismiss')).toBeFalsy()
      expect(queryByText(mockAccount.toLowerCase())).toBeTruthy()
      expect(
        getByText(
          'walletConnectRequest.session.warnUnsupportedChains.title, {"dappName":"React App"}'
        )
      ).toBeTruthy()
    })
  })

  describe('unsupported method', () => {
    it('should show a warning', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={{
              ...namespacesToApprove,
              eip155: {
                ...namespacesToApprove.eip155,
                methods: [...namespacesToApprove.eip155.methods, 'some_unsupported_method'],
              },
            }}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      expect(getByText('connectToWallet, {"dappName":"React App"}')).toBeTruthy()
      expect(getByText('shareInfo')).toBeTruthy()
      // We still want to allow connection
      expect(getByText('walletConnectRequest.connectWalletAction')).toBeTruthy()
      expect(queryByText('dismiss')).toBeFalsy()
      expect(queryByText(mockAccount.toLowerCase())).toBeTruthy()
      expect(
        getByText(
          'walletConnectRequest.session.warnSomeUnsupportedMethods.title, {"dappName":"React App"}'
        )
      ).toBeTruthy()
    })
  })

  describe('unsupported event', () => {
    it('should show a warning', () => {
      const { getByText, queryByText } = render(
        <Provider store={store}>
          <SessionRequest
            version={2}
            pendingSession={pendingSession}
            namespacesToApprove={{
              ...namespacesToApprove,
              eip155: {
                ...namespacesToApprove.eip155,
                events: [...namespacesToApprove.eip155.events, 'some_unsupported_event'],
              },
            }}
            supportedChains={supportedChains}
          />
        </Provider>
      )

      expect(getByText('connectToWallet, {"dappName":"React App"}')).toBeTruthy()
      expect(getByText('shareInfo')).toBeTruthy()
      // We still want to allow connection
      expect(getByText('walletConnectRequest.connectWalletAction')).toBeTruthy()
      expect(queryByText('dismiss')).toBeFalsy()
      expect(queryByText(mockAccount.toLowerCase())).toBeTruthy()
      expect(
        getByText(
          'walletConnectRequest.session.warnSomeUnsupportedEvents.title, {"dappName":"React App"}'
        )
      ).toBeTruthy()
    })
  })
})
