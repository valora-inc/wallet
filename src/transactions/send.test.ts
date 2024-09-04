import { ErrorMessages } from 'src/app/ErrorMessages'
import { isTxPossiblyPending } from 'src/transactions/send'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})

const state = (override?: { celoBalance: string }) =>
  createMockStore({
    tokens: {
      tokenBalances: {
        [mockCusdTokenId]: {
          balance: '0',
          priceUsd: '1',
          symbol: 'cUSD',
          address: mockCusdAddress,
          tokenId: mockCusdTokenId,
          networkId: NetworkId['celo-alfajores'],
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeurTokenId]: {
          balance: '1',
          priceUsd: '1.2',
          symbol: 'cEUR',
          address: mockCeurAddress,
          tokenId: mockCeurTokenId,
          networkId: NetworkId['celo-alfajores'],
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
        [mockCeloTokenId]: {
          balance: override?.celoBalance ?? '0',
          priceUsd: '3.5',
          symbol: 'CELO',
          address: mockCeloAddress,
          tokenId: mockCeloTokenId,
          networkId: NetworkId['celo-alfajores'],
          isFeeCurrency: true,
          priceFetchedAt: Date.now(),
        },
      },
    },
  }).getState()

describe('isTxPossiblyPending', () => {
  it('returns false when err is invalid', () => {
    const result = isTxPossiblyPending(null)
    expect(result).toBe(false)
  })
  it('returns true when timeout error', () => {
    const result = isTxPossiblyPending(new Error(ErrorMessages.TRANSACTION_TIMEOUT))
    expect(result).toBe(true)
  })
  it('returns true when known tx error', () => {
    const result = isTxPossiblyPending(new Error('known transaction error!!!'))
    expect(result).toBe(true)
  })
  it('returns true when nonce too low', () => {
    const result = isTxPossiblyPending(new Error('nonce too low error!!!'))
    expect(result).toBe(true)
  })
  it('returns true when failed to check for tx receipt', () => {
    const result = isTxPossiblyPending(new Error('Failed to check for transaction receipt:\n{}')) // error message copied from user's logs
    expect(result).toBe(true)
  })
  it('returns false when error is unrelated', () => {
    const result = isTxPossiblyPending(new Error('some unrelated error!!!'))
    expect(result).toBe(false)
  })
})
