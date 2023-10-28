import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import erc20 from 'src/abis/IERC20'
import { TokenBalanceWithAddress } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import {
  getFeeCurrencyAddress,
  getMaxGasCost,
  prepareERC20TransferTransaction,
  prepareTransactions,
  tryEstimateTransaction,
  tryEstimateTransactions,
} from 'src/viem/prepareTransactions'
import { Address, BaseError, EstimateGasExecutionError, encodeFunctionData } from 'viem'
import mocked = jest.mocked

jest.mock('src/viem/estimateFeesPerGas')
jest.mock('viem')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('prepareTransactions module', () => {
  const mockFeeCurrencies: TokenBalanceWithAddress[] = [
    {
      address: '0xfee1',
      balance: new BigNumber(100), // 10k units, 100.0 decimals
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
      balance: new BigNumber(70), // 70k units, 70.0 decimals
      decimals: 3,
      priceUsd: null,
      lastKnownPriceUsd: null,
      tokenId: 'celo-mainnet:0xfee2',
      symbol: 'FEE2',
      name: 'Fee token 2',
      networkId: NetworkId['celo-mainnet'],
      isNative: false, // means we add 50_000 units / 50.0 decimal padding for gas
    },
  ]
  const mockSpendToken: TokenBalanceWithAddress = {
    address: '0xspend',
    balance: new BigNumber(5), // 50k units, 5.0 decimals
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
    it("returns a 'not-enough-balance-for-gas' result when the balances for feeCurrencies are too low to cover the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(100),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(1_000))

      // gas fee is 10 * 10k = 100k units, too high for either fee currency

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
      expect('feeCurrencies' in result && result.feeCurrencies).toStrictEqual(mockFeeCurrencies)
    })
    it("returns a 'need-decrease-spend-amount-for-gas' result when spending more than the max amount of a feeCurrency", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      })

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[1],
        spendTokenAmount: new BigNumber(100_000),
        decreasedAmountGasCostMultiplier: 1.01,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(15_000), // 50k will be added for fee currency 1 since it is non-native
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'need-decrease-spend-amount-for-gas',
        maxGasCost: new BigNumber('65.65'), // (15k + 50k non-native gas token buffer) * 1.01 multiplier / 1000 feeCurrency1 decimals
        feeCurrency: mockFeeCurrencies[1],
        decreasedSpendAmount: new BigNumber(4.35), // 70.0 balance minus maxGasCost
      })
    })
    it("returns a 'need-decrease-spend-amount-for-gas' result when spending the exact max amount of a feeCurrency, and no other feeCurrency has enough balance to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      })

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[1],
        spendTokenAmount: mockFeeCurrencies[1].balance.shiftedBy(mockFeeCurrencies[1].decimals),
        decreasedAmountGasCostMultiplier: 1.01,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(15_000), // 50k will be added for fee currency 1 since it is non-native
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'need-decrease-spend-amount-for-gas',
        maxGasCost: new BigNumber('65.65'), // (15k + 50k non-native gas token buffer) * 1.01 multiplier / 1000 feeCurrency1 decimals
        feeCurrency: mockFeeCurrencies[1],
        decreasedSpendAmount: new BigNumber(4.35), // 70.0 balance minus maxGasCost
      })
    })
    it("returns a 'need-decrease-spend-amount-for-gas' result when spending close to the max amount of a feeCurrency, and no other feeCurrency has enough balance to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      })

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[1],
        spendTokenAmount: mockFeeCurrencies[1].balance
          .shiftedBy(mockFeeCurrencies[1].decimals)
          .minus(1), // 69.999k
        decreasedAmountGasCostMultiplier: 1.01,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(15_000), // 50k will be added for fee currency 1 since it is non-native
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'need-decrease-spend-amount-for-gas',
        maxGasCost: new BigNumber('65.65'), // (15k + 50k non-native gas token buffer) * 1.01 multiplier / 1000 feeCurrency1 decimals
        feeCurrency: mockFeeCurrencies[1],
        decreasedSpendAmount: new BigNumber(4.35), // 70.0 balance minus maxGasCost
      })
    })
    it("returns a 'possible' result when spending a feeCurrency, when there's enough balance to cover for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(500))

      // gas fee is 0.5k units from first transaction, plus 0.1k units from second transaction

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[0],
        spendTokenAmount: new BigNumber(4_000),
        decreasedAmountGasCostMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100),
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'possible',
        transactions: [
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(500),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
          },
        ],
      })
    })
    it("returns a 'possible' result when spending the max balance of a feeCurrency when there's another feeCurrency to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(500))

      // for fee1 (native): gas fee is 0.5k units from first transaction, plus 0.1k units from second transaction
      // for fee2 (non-native): gas fee is 0.5k units from first transaction, plus 50.1k ((50k * 1) + 0.1k) units from second transaction

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[0],
        spendTokenAmount: mockFeeCurrencies[0].balance.shiftedBy(mockFeeCurrencies[0].decimals),
        decreasedAmountGasCostMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100), // 50k will be added for fee currency 2 since it is non-native
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'possible',
        transactions: [
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(500),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
            feeCurrency: mockFeeCurrencies[1].address,
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(50_100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
            feeCurrency: mockFeeCurrencies[1].address,
          },
        ],
      })
    })
    it("returns a 'possible' result when spending the max balance of a token that isn't a feeCurrency when there's another feeCurrency to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(500))

      // for fee1 (native): gas fee is 0.5k units from first transaction, plus 0.1k units from second transaction

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockSpendToken,
        spendTokenAmount: mockSpendToken.balance.shiftedBy(mockSpendToken.decimals),
        decreasedAmountGasCostMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100), // 50k will be added for fee currency 2 since it is non-native
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'possible',
        transactions: [
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(500),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: undefined,
          },
        ],
      })
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
      expect(estimateTransactionOutput).toStrictEqual({
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
      expect(estimateTransactionOutput).toStrictEqual({
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
      expect(estimateTransactionsOutput).toStrictEqual([
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

  describe('getFeeCurrencyAddress', () => {
    it('returns fee currency address if fee currency is not native', () => {
      expect(getFeeCurrencyAddress(mockFeeCurrencies[1])).toEqual('0xfee2')
    })
    it('returns undefined if fee currency is native', () => {
      expect(getFeeCurrencyAddress(mockFeeCurrencies[0])).toEqual(undefined)
    })
  })

  it('prepareERC20TransferTransaction', async () => {
    const mockPrepareTransactions = jest.fn()
    mocked(encodeFunctionData).mockReturnValue('0xabc')
    await prepareERC20TransferTransaction(
      {
        fromWalletAddress: '0x123',
        toWalletAddress: '0x456',
        sendToken: mockSpendToken,
        amount: BigInt(100),
        feeCurrencies: mockFeeCurrencies,
      },
      mockPrepareTransactions
    )
    expect(mockPrepareTransactions).toHaveBeenCalledWith({
      feeCurrencies: mockFeeCurrencies,
      spendToken: mockSpendToken,
      spendTokenAmount: new BigNumber(100),
      decreasedAmountGasCostMultiplier: 1,
      baseTransactions: [
        {
          from: '0x123',
          to: mockSpendToken.address,
          type: 'cip42',
          data: '0xabc',
        },
      ],
    })
    expect(encodeFunctionData).toHaveBeenCalledWith({
      abi: erc20.abi,
      functionName: 'transfer',
      args: ['0x456', BigInt(100)],
    })
  })
})
