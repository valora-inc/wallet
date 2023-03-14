import { SessionTypes, SignClientTypes } from '@walletconnect/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { DappRequestOrigin } from 'src/analytics/types'
import { activeDappSelector } from 'src/dapps/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { WalletConnectRequestType } from 'src/walletConnect/types'
import { sessionProposal as sessionProposalAction } from 'src/walletConnect/v2/actions'
import {
  getDefaultSessionTrackedProperties,
  walletConnectV2Saga,
  _applyIconFixIfNeeded,
} from 'src/walletConnect/v2/saga'
import { createMockStore } from 'test/utils'
import { mocked } from 'ts-jest/utils'

function createSessionProposal(
  proposerMetadata: SignClientTypes.Metadata
): SignClientTypes.EventArguments['session_proposal'] {
  return {
    id: 1669989187506938,
    params: {
      expiry: 1669989496,
      proposer: {
        publicKey: 'f4284dc764da82e9b62d625f4dfea4088142f477c0d7420cdec2a0f49959c233',
        metadata: proposerMetadata,
      },
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
  }
}

function createSession(proposerMetadata: SignClientTypes.Metadata): SessionTypes.Struct {
  return {
    expiry: 1671006057,
    self: {
      metadata: {
        icons: ['https://valoraapp.com//favicon.ico'],
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
    requiredNamespaces: {
      eip155: {
        events: ['chainChanged', 'accountsChanged'],
        chains: ['eip155:44787'],
        methods: ['eth_sendTransaction', 'eth_signTypedData'],
      },
    },
  }
}

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
        const sessionProposal = createSessionProposal(metadata as SignClientTypes.Metadata)
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
        const session = createSession(metadata as SignClientTypes.Metadata)
        _applyIconFixIfNeeded(session)
        // eslint-disable-next-line jest/no-standalone-expect
        expect(session.peer.metadata?.icons).toStrictEqual(expected)
      }
    )
  })
})

// See also our comprehensive E2E tests for WalletConnect
// The tests here are mainly to check things that are more difficult to cover from the E2E test
describe(walletConnectV2Saga, () => {
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
    mocked(navigate).mockImplementationOnce(() => {
      throw new Error('An unexpected failure')
    })
    const state = createMockStore({}).getState()
    await expectSaga(walletConnectV2Saga)
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
      version: 2,
    })
  })
})
