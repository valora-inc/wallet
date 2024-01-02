import { CoreTypes, SessionTypes } from '@walletconnect/types'
import { buildApprovedNamespaces } from '@walletconnect/utils'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import { expectSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { showMessage } from 'src/alert/actions'
import { DappRequestOrigin, WalletConnectPairingOrigin } from 'src/analytics/types'
import { walletConnectEnabledSelector } from 'src/app/selectors'
import { activeDappSelector } from 'src/dapps/selectors'
import i18n from 'src/i18n'
import { isBottomSheetVisible, navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { Network } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import {
  Actions,
  acceptSession as acceptSessionAction,
  sessionProposal as sessionProposalAction,
} from 'src/walletConnect/actions'
import { SupportedActions, SupportedEvents } from 'src/walletConnect/constants'
import {
  _acceptSession,
  _applyIconFixIfNeeded,
  _setClientForTesting,
  _showSessionRequest,
  getDefaultSessionTrackedProperties,
  initialiseWalletConnect,
  initialiseWalletConnectV2,
  normalizeTransaction,
  walletConnectSaga,
} from 'src/walletConnect/saga'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import { walletAddressSelector } from 'src/web3/selectors'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'
import { getTransactionCount } from 'viem/actions'

jest.mock('src/statsig')

function createSessionProposal(
  proposerMetadata: CoreTypes.Metadata
): Web3WalletTypes.EventArguments['session_proposal'] {
  return {
    id: 1669989187506938,
    params: {
      expiry: 1669989496,
      proposer: {
        publicKey: 'f4284dc764da82e9b62d625f4dfea4088142f477c0d7420cdec2a0f49959c233',
        metadata: proposerMetadata,
      },
      optionalNamespaces: {},
      requiredNamespaces: {
        eip155: {
          events: ['chainChanged', 'accountsChanged'],
          chains: ['eip155:44787'],
          methods: ['eth_sendTransaction', 'eth_signTypedData'],
        },
      },
      id: 1669989187506938,
      relays: [
        {
          protocol: 'irn',
        },
      ],
      pairingTopic: 'ab7c79764b6838abd24669ab735f6ce40bb26ca4d54cf948daca8e80a2eb6db1',
    },
    verifyContext: {
      verified: {
        origin: '',
        validation: 'UNKNOWN',
        verifyUrl: '',
      },
    },
  }
}

function createSession(proposerMetadata: CoreTypes.Metadata): SessionTypes.Struct {
  return {
    expiry: 1671006057,
    self: {
      metadata: {
        icons: ['https://valoraapp.com/favicon.ico'],
        description: 'A mobile payments wallet that works worldwide',
        name: 'Valora',
        url: 'https://valoraapp.com/',
      },
      publicKey: '61a2616b6d7394ed7dd430ea5921d1c32289b300ccd2d588af9e25c21f239612',
    },
    relay: {
      protocol: 'irn',
    },
    controller: '61a2616b6d7394ed7dd430ea5921d1c32289b300ccd2d588af9e25c21f239612',
    peer: {
      metadata: proposerMetadata,
      publicKey: '91c2e7baeade1d3d46a51e20746cf1c294ea3f9c017d4d72b08db3e87a74f50a',
    },
    namespaces: {
      eip155: {
        accounts: ['eip155:44787:0x6131a6d616a4be3737b38988847270a64bc10caa'],
        events: ['chainChanged', 'accountsChanged'],
        methods: ['eth_sendTransaction', 'eth_signTypedData'],
      },
    },
    acknowledged: true,
    topic: '243b33442b6190b97055201b5a8817f4e604e3f37b5376e78ee0b3715cc6211c',
    pairingTopic: '98339e3d81179f61656592154af78d308ba7f8d01498772320d2d87c90cafb85',
    requiredNamespaces: {
      eip155: {
        events: ['chainChanged', 'accountsChanged'],
        chains: ['eip155:44787'],
        methods: ['eth_sendTransaction', 'eth_signTypedData'],
      },
    },
    optionalNamespaces: {},
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('getDefaultSessionTrackedProperties', () => {
  const proposerMetadata = {
    url: 'someUrl',
    icons: ['someIcon'],
    description: 'someDescription',
    name: 'someName',
  }
  const sessionProposal = createSessionProposal(proposerMetadata)
  const session = createSession(proposerMetadata)

  it.each`
    sessionType          | sessionInfo
    ${'sessionProposal'} | ${sessionProposal}
    ${'session'}         | ${session}
  `('returns the correct properties for $sessionType', async ({ sessionInfo }) => {
    await expectSaga(getDefaultSessionTrackedProperties, sessionInfo)
      .provide([[select(activeDappSelector), null]])
      .returns({
        version: 2,
        dappRequestOrigin: DappRequestOrigin.External,
        dappName: 'someName',
        dappUrl: 'someUrl',
        dappDescription: 'someDescription',
        dappIcon: 'someIcon',
        relayProtocol: 'irn',
        eip155Events: ['chainChanged', 'accountsChanged'],
        eip155Chains: ['eip155:44787'],
        eip155Methods: ['eth_sendTransaction', 'eth_signTypedData'],
      })
      .run()
  })
})

describe('applyIconFixIfNeeded', () => {
  const eachMetadata = it.each`
    metadata                    | expected
    ${undefined}                | ${undefined}
    ${{}}                       | ${[]}
    ${{ icons: {} }}            | ${[]}
    ${{ icons: [7] }}           | ${[]}
    ${{ icons: [null] }}        | ${[]}
    ${{ icons: [undefined] }}   | ${[]}
    ${{ icons: [''] }}          | ${[]}
    ${{ icons: ['something'] }} | ${['something']}
  `

  describe('with a session proposal', () => {
    eachMetadata(
      'fixes the `icons` property when the metadata is $metadata',
      async ({ metadata, expected }) => {
        const sessionProposal = createSessionProposal(metadata as Web3WalletTypes.Metadata)
        _applyIconFixIfNeeded(sessionProposal)
        // eslint-disable-next-line jest/no-standalone-expect
        expect(sessionProposal.params.proposer.metadata?.icons).toStrictEqual(expected)
      }
    )
  })

  describe('with a session', () => {
    eachMetadata(
      'fixes the `icons` property when the metadata is $metadata',
      async ({ metadata, expected }) => {
        const session = createSession(metadata as Web3WalletTypes.Metadata)
        _applyIconFixIfNeeded(session)
        // eslint-disable-next-line jest/no-standalone-expect
        expect(session.peer.metadata?.icons).toStrictEqual(expected)
      }
    )
  })
})

// See also our comprehensive E2E tests for WalletConnect
// The tests here are mainly to check things that are more difficult to cover from the E2E test
describe(walletConnectSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  const sessionProposal = createSessionProposal({
    url: 'someUrl',
    icons: ['someIcon'],
    description: 'someDescription',
    name: 'someName',
  })

  // Sanity check to ensure `safely` does its job
  it('continues to handle actions even when handlers previously failed unexpectedly', async () => {
    jest.mocked(navigate).mockImplementationOnce(() => {
      throw new Error('An unexpected failure')
    })
    const state = createMockStore({}).getState()
    await expectSaga(walletConnectSaga)
      .withState(state)
      // This one will fail internally
      .dispatch(sessionProposalAction(sessionProposal))
      // This one will still succeed (previous one didn't crash the whole saga thanks to `safely`)
      .dispatch(sessionProposalAction(sessionProposal))
      .silentRun()

    expect(navigate).toHaveBeenCalledTimes(2)
    expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.Session,
      pendingSession: sessionProposal,
      namespacesToApprove: expect.anything(),
      supportedChains: ['eip155:44787'],
      version: 2,
    })
  })
})

describe('showSessionRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  const sessionProposal = createSessionProposal({
    url: 'someUrl',
    icons: ['someIcon'],
    description: 'someDescription',
    name: 'someName',
  })

  it('navigates to the screen to approve the session', async () => {
    const state = createMockStore({}).getState()
    await expectSaga(_showSessionRequest, sessionProposal)
      .withState(state)
      .provide([[select(activeDappSelector), null]])
      .run()

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.Session,
      pendingSession: sessionProposal,
      namespacesToApprove: expect.anything(),
      supportedChains: ['eip155:44787'],
      version: 2,
    })

    // Check the namespaces to approve are correct
    expect((navigate as jest.Mock).mock.calls[0][1].namespacesToApprove).toMatchInlineSnapshot(`
      {
        "eip155": {
          "accounts": [
            "eip155:44787:0x0000000000000000000000000000000000007e57",
          ],
          "chains": [
            "eip155:44787",
          ],
          "events": [
            "accountsChanged",
            "chainChanged",
          ],
          "methods": [
            "eth_sendTransaction",
            "eth_signTypedData",
          ],
        },
      }
    `)
  })

  it('includes all supported chains for session approval', async () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (gate) => gate === StatsigFeatureGates.USE_VIEM_FOR_WALLETCONNECT_TRANSACTIONS
      )
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showWalletConnect: ['celo-alfajores', 'ethereum-sepolia'],
    })
    const state = createMockStore({}).getState()
    await expectSaga(_showSessionRequest, sessionProposal)
      .withState(state)
      .provide([[select(activeDappSelector), null]])
      .run()

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.Session,
      pendingSession: sessionProposal,
      namespacesToApprove: expect.objectContaining({
        eip155: expect.objectContaining({
          // matches the chains requested by the dapp
          chains: ['eip155:44787'],
          accounts: ['eip155:44787:0x0000000000000000000000000000000000007e57'],
        }),
      }),
      supportedChains: ['eip155:44787', 'eip155:11155111'], // matches the chains supported by the wallet
      version: 2,
    })
  })

  it('navigates to the screen to approve the session when requiring an EIP155 namespace with unsupported chains/methods/events', async () => {
    const state = createMockStore({}).getState()
    const session = {
      ...sessionProposal,
      params: {
        ...sessionProposal.params,
        requiredNamespaces: {
          ...sessionProposal.params.requiredNamespaces,
          eip155: {
            ...sessionProposal.params.requiredNamespaces.eip155,
            chains: ['eip155:1'], // unsupported chain
            methods: ['eth_signTransaction', 'some_unsupported_method'],
            events: ['accountsChanged', 'some_unsupported_event'],
          },
        },
        optionalNamespaces: {
          eip155: {
            chains: ['eip155:44787'], // this optional chain is supported and will be added to the approved namespaces
            methods: ['eth_signTransaction', 'some_optional_unsupported_method'],
            events: ['accountsChanged', 'some_optional_unsupported_event'],
          },
        },
      },
    }
    await expectSaga(_showSessionRequest, session)
      .withState(state)
      .provide([[select(activeDappSelector), null]])
      .run()

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.Session,
      pendingSession: session,
      namespacesToApprove: expect.anything(),
      supportedChains: ['eip155:44787'],
      version: 2,
    })

    // Check the namespaces to approve are correct
    // Note that it includes the unsupported eip155 chains/methods/events
    // + the optional eip155 chain (because it's supported)
    expect((navigate as jest.Mock).mock.calls[0][1].namespacesToApprove).toMatchInlineSnapshot(`
      {
        "eip155": {
          "accounts": [
            "eip155:1:0x0000000000000000000000000000000000007e57",
            "eip155:44787:0x0000000000000000000000000000000000007e57",
          ],
          "chains": [
            "eip155:1",
            "eip155:44787",
          ],
          "events": [
            "accountsChanged",
            "some_unsupported_event",
          ],
          "methods": [
            "eth_signTransaction",
            "some_unsupported_method",
          ],
        },
      }
    `)
  })

  it('navigates to the screen to reject the session when requiring a non EIP155 namespace', async () => {
    const state = createMockStore({}).getState()
    const session = {
      ...sessionProposal,
      params: {
        ...sessionProposal.params,
        requiredNamespaces: {
          solana: {
            methods: ['solana_signTransaction', 'solana_signMessage'],
            chains: ['solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ'],
            events: ['some_event'],
          },
        },
      },
    }
    await expectSaga(_showSessionRequest, session)
      .withState(state)
      .provide([[select(activeDappSelector), null]])
      .run()

    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.WalletConnectRequest, {
      type: WalletConnectRequestType.Session,
      pendingSession: session,
      namespacesToApprove: null,
      supportedChains: ['eip155:44787'],
      version: 2,
    })
  })
})

describe('acceptSession', () => {
  const sessionProposal = createSessionProposal({
    url: 'someUrl',
    icons: ['someIcon'],
    description: 'someDescription',
    name: 'someName',
  })
  let mockClient: any

  beforeEach(() => {
    mockClient = {
      approveSession: jest.fn(),
      getActiveSessions: jest.fn(() => {
        return Promise.resolve({
          x: {
            pairingTopic: sessionProposal.params.pairingTopic,
          },
        })
      }),
    }
    _setClientForTesting(mockClient as any)
  })

  it('successfully accepts the session', async () => {
    const state = createMockStore({}).getState()

    const approvedNamespaces = buildApprovedNamespaces({
      proposal: sessionProposal.params,
      supportedNamespaces: {
        eip155: {
          chains: ['eip155:44787'],
          methods: Object.values(SupportedActions) as string[],
          events: Object.values(SupportedEvents) as string[],
          accounts: [`eip155:44787:${mockAccount}`],
        },
      },
    })

    await expectSaga(_acceptSession, acceptSessionAction(sessionProposal, approvedNamespaces))
      .withState(state)
      .provide([[call(isBottomSheetVisible, Screens.WalletConnectRequest), false]])
      .put.actionType(Actions.SESSION_CREATED)
      .put(showMessage(i18n.t('connectionSuccess', { dappName: 'someName' })))
      .run()

    expect(mockClient.approveSession).toHaveBeenCalledTimes(1)
    expect(mockClient.approveSession.mock.calls[0]).toMatchInlineSnapshot(`
      [
        {
          "id": 1669989187506938,
          "namespaces": {
            "eip155": {
              "accounts": [
                "eip155:44787:0x0000000000000000000000000000000000007E57",
              ],
              "chains": [
                "eip155:44787",
              ],
              "events": [
                "accountsChanged",
                "chainChanged",
              ],
              "methods": [
                "eth_sendTransaction",
                "eth_signTypedData",
              ],
            },
          },
          "relayProtocol": "irn",
        },
      ]
    `)
  })
})

// TODO: use a real connection string
const v2ConnectionString =
  'wc:79a02f869d0f921e435a5e0643304548ebfa4a0430f9c66fe8b1a9254db7ef77@2?controller=false&publicKey=f661b0a9316a4ce0b6892bdce42bea0f45037f2c1bee9e118a3a4bc868a32a39&relay={"protocol":"waku"}'

describe('initialiseWalletConnect', () => {
  const origin = WalletConnectPairingOrigin.Deeplink

  it('initializes v2 if enabled', async () => {
    await expectSaga(initialiseWalletConnect, v2ConnectionString, origin)
      .provide([
        [select(walletConnectEnabledSelector), { v1: true, v2: true }],
        [call(initialiseWalletConnectV2, v2ConnectionString, origin), {}],
      ])
      .call(initialiseWalletConnectV2, v2ConnectionString, origin)
      .run()
  })

  it('doesnt initialize v2 if disabled', async () => {
    await expectSaga(initialiseWalletConnect, v2ConnectionString, origin)
      .provide([[select(walletConnectEnabledSelector), { v1: true, v2: false }]])
      .not.call(initialiseWalletConnectV2, v2ConnectionString, origin)
      .run()
  })
})

describe('normalizeTransaction', () => {
  function createDefaultProviders(network: Network) {
    const defaultProviders: (EffectProviders | StaticProvider)[] = [
      [select(walletAddressSelector), mockAccount],
      [
        call(getTransactionCount, publicClient[network], {
          address: mockAccount,
          blockTag: 'pending',
        }),
        123,
      ],
    ]

    return defaultProviders
  }

  it('ensures `gasLimit` value is removed', async () => {
    await expectSaga(
      normalizeTransaction,
      {
        from: '0xTEST',
        data: '0xABC',
        gasLimit: '0x5208',
        feeCurrency: '0xcUSD',
      },
      Network.Celo
    )
      .provide(createDefaultProviders(Network.Celo))
      .returns({
        from: '0xTEST',
        data: '0xABC',
        nonce: 123,
      })
      .run()
  })

  it('ensures `gasPrice` is stripped away', async () => {
    await expectSaga(
      normalizeTransaction,
      { from: '0xTEST', data: '0xABC', gasPrice: '0x5208' },
      Network.Celo
    )
      .provide(createDefaultProviders(Network.Celo))
      .returns({
        from: '0xTEST',
        data: '0xABC',
        nonce: 123,
      })
      .run()
  })

  it('ensures `gas` and `feeCurrency` is stripped away for a Celo transaction request', async () => {
    await expectSaga(
      normalizeTransaction,
      { from: '0xTEST', data: '0xABC', gas: '0x5208', feeCurrency: '0xabcd' },
      Network.Celo
    )
      .provide(createDefaultProviders(Network.Celo))
      .returns({
        from: '0xTEST',
        data: '0xABC',
        nonce: 123,
      })
      .run()
  })

  it('does not strip away `gas` for non-Celo transaction request', async () => {
    await expectSaga(
      normalizeTransaction,
      { from: '0xTEST', data: '0xABC', gas: '0x5208' },
      Network.Ethereum
    )
      .provide(createDefaultProviders(Network.Ethereum))
      .returns({
        from: '0xTEST',
        data: '0xABC',
        gas: BigInt('0x5208'),
        nonce: 123,
      })
      .run()
  })
})
