import BigNumber from 'bignumber.js'
import { Network, NetworkId } from 'src/transactions/types'
import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import {
  getMaxGasCost,
  prepareTransactions,
  tryEstimateTransaction,
  tryEstimateTransactions,
} from 'src/viem/prepareTransactions'
import { Address, BaseError, EstimateGasExecutionError } from 'viem'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import mocked = jest.mocked
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'

jest.mock('src/viem/estimateFeesPerGas')

describe('prepareTransactions module', () => {
  const mockFeeCurrencies: TokenBalance[] = [
    {
      address: '0xfee1',
      balance: new BigNumber(10), // 100 wei, 10.0 decimals
      decimals: 2,
      priceUsd: null,
      lastKnownPriceUsd: null,
      tokenId: 'celo-mainnet:native',
      symbol: 'FEE1',
      name: 'Fee token 1',
      networkId: NetworkId['celo-mainnet'],
      isNative: true,
    },
    {
      address: '0xfee2',
      balance: new BigNumber(20), // 20k wei, 20.0 decimals
      decimals: 3,
      priceUsd: null,
      lastKnownPriceUsd: null,
      tokenId: 'celo-mainnet:0xfee2',
      symbol: 'FEE2',
      name: 'Fee token 2',
      networkId: NetworkId['celo-mainnet'],
      isNative: false, // means we add 50_000 wei / 50.0 decimal padding for gas
    },
  ]
  const mockSpendToken: TokenBalanceWithAddress = {
    address: '0xspend',
    balance: new BigNumber(5), // 50k wei, 5.0 decimals
    decimals: 4,
    priceUsd: null,
    lastKnownPriceUsd: null,
    networkId: NetworkId['celo-mainnet'],
    tokenId: 'celo-mainnet:0xspend',
    symbol: 'SPEND',
    name: 'Spend token',
  }
  const mockPublicClient = { estimateGas: jest.fn() }
  beforeAll(() => {
    publicClient[Network.Celo] = mockPublicClient as any
  })
  describe('prepareTransactions function', () => {
    it('not enough balance for gas', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(10),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(10_000))

      // gas fee is 10 * 10k = 100k wei, too high for either fee currency

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockSpendToken,
        spendTokenAmount: new BigNumber(100_000),
        decreasedAmountGasCostMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
        ],
      })
      expect(result.type).toEqual('not-enough-balance-for-gas')
      expect('feeCurrencies' in result && result.feeCurrencies).toEqual(mockFeeCurrencies)
    })
  })
  describe('tryEstimateTransaction', () => {
    it('does not include feeCurrency if not address undefined', async () => {
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(123))
      const baseTransaction: TransactionRequestCIP42 = { from: '0x123' }
      const estimateTransactionOutput = await tryEstimateTransaction({
        baseTransaction,
        maxFeePerGas: BigInt(456),
        feeCurrencySymbol: 'FEE',
      })
      expect(estimateTransactionOutput && 'feeCurrency' in estimateTransactionOutput).toEqual(false)
      expect(estimateTransactionOutput).toEqual({
        from: '0x123',
        gas: BigInt(123),
        maxFeePerGas: BigInt(456),
        maxPriorityFeePerGas: undefined,
      })
    })
    it('includes feeCurrency if address is given', async () => {
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(123))
      const baseTransaction: TransactionRequestCIP42 = { from: '0x123' }
      const estimateTransactionOutput = await tryEstimateTransaction({
        baseTransaction,
        maxFeePerGas: BigInt(456),
        feeCurrencySymbol: 'FEE',
        feeCurrencyAddress: '0xabc',
        maxPriorityFeePerGas: BigInt(789),
      })
      expect(estimateTransactionOutput).toEqual({
        from: '0x123',
        gas: BigInt(123),
        maxFeePerGas: BigInt(456),
        feeCurrency: '0xabc',
        maxPriorityFeePerGas: BigInt(789),
      })
    })
    it('returns null if estimateGas throws EstimateGasExecutionError', async () => {
      mockPublicClient.estimateGas.mockRejectedValue(
        new EstimateGasExecutionError(new BaseError('test-cause'), {})
      )
      const baseTransaction: TransactionRequestCIP42 = { from: '0x123' }
      const estimateTransactionOutput = await tryEstimateTransaction({
        baseTransaction,
        maxFeePerGas: BigInt(456),
        feeCurrencySymbol: 'FEE',
        feeCurrencyAddress: '0xabc',
        maxPriorityFeePerGas: BigInt(789),
      })
      expect(estimateTransactionOutput).toEqual(null)
    })
  })
  describe('tryEstimateTransactions', () => {
    it('returns null if estimateGas throws EstimateGasExecutionError', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(10),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockRejectedValue(
        new EstimateGasExecutionError(new BaseError('test-cause'), {})
      )
      const estimateTransactionsOutput = await tryEstimateTransactions(
        [{ from: '0x123' }, { from: '0x123', gas: BigInt(456) }],
        mockFeeCurrencies[0]
      )
      expect(estimateTransactionsOutput).toEqual(null)
    })
    it('estimates gas only for transactions missing a gas field', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(10),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(123))
      const estimateTransactionsOutput = await tryEstimateTransactions(
        [{ from: '0x123' }, { from: '0x123', gas: BigInt(456) }],
        mockFeeCurrencies[0]
      )
      expect(estimateTransactionsOutput).toEqual([
        {
          from: '0x123',
          gas: BigInt(123),
          maxFeePerGas: BigInt(10),
          maxPriorityFeePerGas: undefined,
        },
        {
          from: '0x123',
          gas: BigInt(456),
          maxFeePerGas: BigInt(10),
          maxPriorityFeePerGas: undefined,
        },
      ])
    })
  })
  describe('getMaxGasCost', () => {
    it('adds gas times maxFeePerGas', () => {
      expect(
        getMaxGasCost([
          { gas: BigInt(2), maxFeePerGas: BigInt(3), from: '0x123' },
          { gas: BigInt(5), maxFeePerGas: BigInt(7), from: '0x123' },
        ])
      ).toEqual(new BigNumber(41))
    })
    it('throws if gas or maxFeePerGas are missing', () => {
      expect(() =>
        getMaxGasCost([
          { gas: BigInt(2), maxFeePerGas: BigInt(3), from: '0x123' },
          { gas: BigInt(5), from: '0x123' },
        ])
      ).toThrowError('Missing gas or maxFeePerGas')
      expect(() =>
        getMaxGasCost([
          { maxFeePerGas: BigInt(5), from: '0x123' },
          { gas: BigInt(2), maxFeePerGas: BigInt(3), from: '0x123' },
        ])
      ).toThrowError('Missing gas or maxFeePerGas')
    })
  })
})
