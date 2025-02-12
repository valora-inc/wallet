import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { divviRegistrationCompleted } from 'src/app/actions'
import * as config from 'src/config'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS } from 'src/divviProtocol/constants'
import {
  createRegistrationTransactions,
  sendPreparedRegistrationTransactions,
} from 'src/divviProtocol/registerReferral'
import { store } from 'src/redux/store'
import { NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getMockStoreData } from 'test/utils'
import { mockAccount } from 'test/values'
import { encodeFunctionData, parseEventLogs } from 'viem'

// Note: Statsig is not directly used by this module, but mocking it prevents
// require cycles from impacting the tests.
jest.mock('src/statsig')

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  readContract: jest.fn(),
  parseEventLogs: jest.fn(),
}))

jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
const mockStore = jest.mocked(store)
mockStore.getState.mockImplementation(getMockStoreData)
mockStore.dispatch = jest.fn()

jest.mock('src/config')

const mockBeefyRegistrationTx = {
  data: encodeFunctionData({
    abi: registryContractAbi,
    functionName: 'registerReferral',
    args: ['referrer-id', 'beefy'],
  }),
  to: REGISTRY_CONTRACT_ADDRESS,
}

describe('createRegistrationTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(config).DIVVI_PROTOCOL_IDS = ['beefy', 'somm']
    jest.mocked(config).DIVVI_REFERRER_ID = 'referrer-id'
  })

  it('returns no transactions if referrer id is not set', async () => {
    jest.mocked(config).DIVVI_REFERRER_ID = undefined

    const result = await createRegistrationTransactions({ networkId: NetworkId['op-mainnet'] })
    expect(result).toEqual([])
  })

  it('returns no transactions if referrer is not registered', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers') {
          return ['unrelated-referrer-id'] // Referrer is not registered
        }
        if (functionName === 'getUsers' && args) {
          return [[], []] // User is not registered
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactions({ networkId: NetworkId['op-mainnet'] })
    expect(result).toEqual([])
  })

  it('returns no transactions if all registrations are completed', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({
        app: {
          divviRegistrations: {
            [NetworkId['op-mainnet']]: ['beefy', 'somm'],
          },
        },
      })
    )
    const result = await createRegistrationTransactions({ networkId: NetworkId['op-mainnet'] })
    expect(result).toEqual([])
  })

  it('returns transactions for pending registrations only', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers') {
          return ['unrelated-referrer-id', 'referrer-id'] // Referrer is registered
        }
        if (functionName === 'getUsers' && args) {
          if (args[0] === 'beefy') {
            return [[], []] // User is not registered
          }
          return [[mockAccount], []] // User is registered
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactions({ networkId: NetworkId['op-mainnet'] })
    expect(result).toEqual([
      {
        data: encodeFunctionData({
          abi: registryContractAbi,
          functionName: 'registerReferral',
          args: ['referrer-id', 'beefy'],
        }),
        to: REGISTRY_CONTRACT_ADDRESS,
      },
    ])
  })

  it('handles errors in contract reads gracefully and returns no corresponding transactions', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers') {
          return ['unrelated-referrer-id', 'referrer-id'] // Referrer is registered
        }
        if (functionName === 'getUsers' && args) {
          if (args[0] === 'beefy') {
            return [[], []] // User is not registered
          }
          throw new Error('Read error for protocol') // simulate error for other protocols
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactions({ networkId: NetworkId['op-mainnet'] })
    expect(result).toEqual([
      {
        data: encodeFunctionData({
          abi: registryContractAbi,
          functionName: 'registerReferral',
          args: ['referrer-id', 'beefy'],
        }),
        to: REGISTRY_CONTRACT_ADDRESS,
      },
    ])
  })
})

describe('sendPreparedRegistrationTransactions', () => {
  const mockViemWallet = {
    account: { address: mockAccount },
    signTransaction: jest.fn(async () => '0xsignedTx'),
    sendRawTransaction: jest.fn(async () => '0xhash'),
  } as any as ViemWallet

  it('sends transactions and updates store on success', async () => {
    const mockNonce = 157
    jest.mocked(parseEventLogs).mockReturnValue([
      {
        args: {
          protocolId: '0x62bd0dd2bb37b275249fe0ec6a61b0fb5adafd50d05a41adb9e1cbfd41ab0607',
        },
      },
    ] as unknown as ReturnType<typeof parseEventLogs>)

    await expectSaga(
      sendPreparedRegistrationTransactions,
      [mockBeefyRegistrationTx],
      NetworkId['op-mainnet'],
      mockViemWallet,
      mockNonce
    )
      .provide([
        [matchers.call.fn(mockViemWallet.signTransaction), '0xsomeSerialisedTransaction'],
        [matchers.call.fn(mockViemWallet.sendRawTransaction), '0xhash'],
        [matchers.call.fn(publicClient.optimism.waitForTransactionReceipt), { status: 'success' }],
      ])
      .put(divviRegistrationCompleted(NetworkId['op-mainnet'], 'beefy'))
      .returns(mockNonce + 1)
      .run()
  })

  it('handles reverted transaction and does not update the store', async () => {
    const mockNonce = 157

    await expectSaga(
      sendPreparedRegistrationTransactions,
      [mockBeefyRegistrationTx],
      NetworkId['op-mainnet'],
      mockViemWallet,
      mockNonce
    )
      .provide([
        [matchers.call.fn(mockViemWallet.signTransaction), '0xsomeSerialisedTransaction'],
        [matchers.call.fn(mockViemWallet.sendRawTransaction), '0xhash'],
        [matchers.call.fn(publicClient.optimism.waitForTransactionReceipt), { status: 'reverted' }],
      ])
      .not.put(divviRegistrationCompleted(NetworkId['op-mainnet'], 'beefy'))
      .returns(mockNonce + 1)
      .run()
  })

  it('does not throw on failure during sending to network, and returns the original nonce', async () => {
    const mockNonce = 157

    await expectSaga(
      sendPreparedRegistrationTransactions,
      [mockBeefyRegistrationTx],
      NetworkId['op-mainnet'],
      mockViemWallet,
      mockNonce
    )
      .provide([
        [matchers.call.fn(mockViemWallet.signTransaction), '0xsomeSerialisedTransaction'],
        [matchers.call.fn(mockViemWallet.sendRawTransaction), throwError(new Error('failure'))],
      ])
      .not.put(divviRegistrationCompleted(NetworkId['op-mainnet'], 'beefy'))
      .returns(mockNonce)
      .run()
  })
})
