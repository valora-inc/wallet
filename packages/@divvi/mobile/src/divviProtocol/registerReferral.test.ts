import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { throwError } from 'redux-saga-test-plan/providers'
import { divviRegistrationCompleted } from 'src/app/actions'
import { getAppConfig } from 'src/appConfig'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS } from 'src/divviProtocol/constants'
import {
  createRegistrationTransactionIfNeeded,
  monitorRegistrationTransaction,
  sendPreparedRegistrationTransaction,
} from 'src/divviProtocol/registerReferral'
import { store } from 'src/redux/store'
import { NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { ViemWallet } from 'src/viem/getLockableWallet'
import { getMockStoreData } from 'test/utils'
import { mockAccount } from 'test/values'
import { encodeFunctionData, Hash, parseEventLogs, stringToHex } from 'viem'

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

jest.mock('src/appConfig')
const mockDefaultAppConfig = {
  registryName: 'test',
  displayName: 'test',
  deepLinkUrlScheme: 'test',
  divviProtocol: {
    protocolIds: ['beefy' as const, 'somm' as const],
    referrerId: 'referrer-id',
  },
}

const beefyHex = stringToHex('beefy', { size: 32 })
const sommHex = stringToHex('somm', { size: 32 })
const referrerIdHex = stringToHex('referrer-id', { size: 32 })
const mockBeefyRegistrationTx = {
  data: encodeFunctionData({
    abi: registryContractAbi,
    functionName: 'registerReferrals',
    args: [referrerIdHex, [beefyHex]],
  }),
  to: REGISTRY_CONTRACT_ADDRESS,
}

describe('createRegistrationTransactionsIfNeeded', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getAppConfig).mockReturnValue(mockDefaultAppConfig)
  })

  it('returns null if referrer id is not set', async () => {
    jest.mocked(getAppConfig).mockReturnValue({ ...mockDefaultAppConfig, divviProtocol: undefined })

    const result = await createRegistrationTransactionIfNeeded({
      networkId: NetworkId['op-mainnet'],
    })
    expect(result).toEqual(null)
  })

  it('returns null if all registrations are completed', async () => {
    mockStore.getState.mockImplementationOnce(() =>
      getMockStoreData({
        app: {
          divviRegistrations: {
            [NetworkId['op-mainnet']]: ['beefy', 'somm'],
          },
        },
      })
    )
    const result = await createRegistrationTransactionIfNeeded({
      networkId: NetworkId['op-mainnet'],
    })
    expect(result).toEqual(null)
  })

  it('returns null and updates redux if there is no cached redux status but the registrations have been done', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers' && args) {
          return [referrerIdHex] // Referrer is registered for all protocols
        }
        if (functionName === 'isUserRegistered' && args) {
          return [true, true] // User is already registered for both 'beefy' and 'somm'
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactionIfNeeded({
      networkId: NetworkId['op-mainnet'],
    })
    expect(result).toEqual(null)
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      divviRegistrationCompleted(NetworkId['op-mainnet'], ['beefy', 'somm'])
    )
  })

  it('returns a transaction for pending registrations only, and updates the redux cache for registered protocols', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers' && args) {
          return [referrerIdHex] // Referrer is registered for all protocols
        }
        if (functionName === 'isUserRegistered' && args) {
          return [true, false] // User is already registered for 'beefy' but not 'somm'
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactionIfNeeded({
      networkId: NetworkId['op-mainnet'],
    })
    expect(result).toEqual({
      data: encodeFunctionData({
        abi: registryContractAbi,
        functionName: 'registerReferrals',
        args: [referrerIdHex, [sommHex]],
      }),
      to: REGISTRY_CONTRACT_ADDRESS,
      from: mockAccount.toLowerCase(),
    }) // the registration transaction should be for 'somm' only
    expect(mockStore.dispatch).toHaveBeenCalledWith(
      divviRegistrationCompleted(NetworkId['op-mainnet'], ['beefy'])
    ) // 'beefy' should be marked as registered already
  })

  it('returns a transaction for registration only against protocols that the referrer is registered for', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers' && args) {
          return args[0] === sommHex ? [referrerIdHex] : ['0x123'] // Referrer is only registered for 'somm'
        }
        if (functionName === 'isUserRegistered' && args) {
          return [false, false] // User not registered for any protocols
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactionIfNeeded({
      networkId: NetworkId['op-mainnet'],
    })
    expect(result).toEqual({
      data: encodeFunctionData({
        abi: registryContractAbi,
        functionName: 'registerReferrals',
        args: [referrerIdHex, [sommHex]],
      }),
      to: REGISTRY_CONTRACT_ADDRESS,
      from: mockAccount.toLowerCase(),
    })
    expect(mockStore.dispatch).not.toHaveBeenCalled()
  })

  it('handles errors in contract reads gracefully and returns no corresponding transactions', async () => {
    jest
      .spyOn(publicClient.optimism, 'readContract')
      .mockImplementation(async ({ functionName, args }) => {
        if (functionName === 'getReferrers' && args) {
          return [referrerIdHex] // Referrer is registered for all protocols
        }
        if (functionName === 'isUserRegistered' && args) {
          throw new Error('Read error for protocol') // simulate error for other protocols
        }
        throw new Error('Unexpected read contract call.')
      })

    const result = await createRegistrationTransactionIfNeeded({
      networkId: NetworkId['op-mainnet'],
    })
    expect(result).toEqual(null)
  })
})

describe('sendPreparedRegistrationTransactions', () => {
  const mockViemWallet = {
    account: { address: mockAccount },
    signTransaction: jest.fn(async () => '0xsignedTx'),
    sendRawTransaction: jest.fn(async () => '0xhash'),
  } as any as ViemWallet

  it('sends transactions and spawns the monitor transaction saga', async () => {
    const mockNonce = 157

    await expectSaga(
      sendPreparedRegistrationTransaction,
      mockBeefyRegistrationTx,
      NetworkId['op-mainnet'],
      mockViemWallet,
      mockNonce
    )
      .provide([
        [matchers.call.fn(mockViemWallet.signTransaction), '0xsomeSerialisedTransaction'],
        [matchers.call.fn(mockViemWallet.sendRawTransaction), '0xhash'],
        [matchers.spawn.fn(monitorRegistrationTransaction), null],
      ])
      .spawn(monitorRegistrationTransaction, '0xhash', NetworkId['op-mainnet'])
      .run()
  })

  it('throws on failure during sending to network', async () => {
    const mockNonce = 157

    await expect(
      expectSaga(
        sendPreparedRegistrationTransaction,
        mockBeefyRegistrationTx,
        NetworkId['op-mainnet'],
        mockViemWallet,
        mockNonce
      )
        .provide([
          [matchers.call.fn(mockViemWallet.signTransaction), '0xsomeSerialisedTransaction'],
          [matchers.call.fn(mockViemWallet.sendRawTransaction), throwError(new Error('failure'))],
        ])
        .not.put(divviRegistrationCompleted(NetworkId['op-mainnet'], ['beefy']))
        .run()
    ).rejects.toThrow()
  })
})

describe('monitorRegistrationTransaction', () => {
  it('updates the store on successful transaction', async () => {
    jest.mocked(parseEventLogs).mockReturnValue([
      {
        args: {
          protocolId: beefyHex,
        },
      },
      {
        args: {
          protocolId: sommHex,
        },
      },
    ] as unknown as ReturnType<typeof parseEventLogs>)

    await expectSaga(monitorRegistrationTransaction, '0xhash' as Hash, NetworkId['op-mainnet'])
      .provide([
        [matchers.call.fn(publicClient.optimism.waitForTransactionReceipt), { status: 'success' }],
      ])
      .put(divviRegistrationCompleted(NetworkId['op-mainnet'], ['beefy', 'somm']))
      .run()
  })

  it('does not update the store on reverted transaction', async () => {
    await expectSaga(monitorRegistrationTransaction, '0xhash' as Hash, NetworkId['op-mainnet'])
      .provide([
        [matchers.call.fn(publicClient.optimism.waitForTransactionReceipt), { status: 'reverted' }],
      ])
      .not.put(divviRegistrationCompleted(expect.anything(), expect.anything()))
      .run()
  })
})
