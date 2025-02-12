import * as config from 'src/config'
import { registryContractAbi } from 'src/divviProtocol/abi/Registry'
import { REGISTRY_CONTRACT_ADDRESS } from 'src/divviProtocol/constants'
import { createRegistrationTransactions } from 'src/divviProtocol/registerReferral'
import { store } from 'src/redux/store'
import { NetworkId } from 'src/transactions/types'
import { publicClient } from 'src/viem'
import { getMockStoreData } from 'test/utils'
import { mockAccount } from 'test/values'
import { encodeFunctionData } from 'viem'

// Note: Statsig is not directly used by this module, but mocking it prevents
// require cycles from impacting the tests.
jest.mock('src/statsig')

jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  readContract: jest.fn(),
}))

jest.mock('src/redux/store', () => ({ store: { getState: jest.fn() } }))
const mockStore = jest.mocked(store)
mockStore.getState.mockImplementation(getMockStoreData)
mockStore.dispatch = jest.fn()

jest.mock('src/config')

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
