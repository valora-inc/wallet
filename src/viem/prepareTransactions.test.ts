import BigNumber from 'bignumber.js'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import erc20 from 'src/abis/IERC20'
import stableToken from 'src/abis/StableToken'
import { TokenBalanceWithAddress } from 'src/tokens/slice'
import { Network, NetworkId } from 'src/transactions/types'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import {
  getFeeCurrencyAddress,
  getFeeCurrencyAndAmount,
  getMaxGasFee,
  prepareERC20TransferTransaction,
  prepareTransactions,
  prepareTransferWithCommentTransaction,
  tryEstimateTransaction,
  tryEstimateTransactions,
} from 'src/viem/prepareTransactions'
import { mockCeloTokenBalance } from 'test/values'
import {
  Address,
  BaseError,
  EstimateGasExecutionError,
  ExecutionRevertedError,
  InsufficientFundsError,
  encodeFunctionData,
} from 'viem'
import mocked = jest.mocked

jest.mock('src/viem/estimateFeesPerGas')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  encodeFunctionData: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('prepareTransactions module', () => {
  const mockInsufficientFundsError = new EstimateGasExecutionError(
    new InsufficientFundsError({
      cause: new BaseError('insufficient funds'),
    }),
    {}
  )
  const mockValueExceededBalanceError = new EstimateGasExecutionError(
    new ExecutionRevertedError({
      cause: new BaseError('test mock', { details: 'transfer value exceeded balance of sender' }),
    }),
    {}
  )
  const mockExceededAllowanceError = new EstimateGasExecutionError(
    new ExecutionRevertedError({
      cause: new BaseError("transfer value exceeded sender's allowance for spender"),
    }),
    {}
  )
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
    it('throws if trying to sendAmount > sendToken balance', async () => {
      await expect(() =>
        prepareTransactions({
          feeCurrencies: mockFeeCurrencies,
          spendToken: mockSpendToken,
          spendTokenAmount: new BigNumber(51_000),
          decreasedAmountGasFeeMultiplier: 1,
          baseTransactions: [
            {
              from: '0xfrom' as Address,
              to: '0xto' as Address,
              data: '0xdata',
              type: 'cip42',
            },
          ],
        })
      ).rejects.toThrowError(/Cannot prepareTransactions for amount greater than balance./)
    })
    it('does not throw if trying to sendAmount > sendToken balance when throwOnSpendTokenAmountExceedsBalance is false', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(100),
        maxPriorityFeePerGas: undefined,
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(1_000))

      await expect(
        prepareTransactions({
          feeCurrencies: mockFeeCurrencies,
          spendToken: mockSpendToken,
          spendTokenAmount: new BigNumber(51_000),
          decreasedAmountGasFeeMultiplier: 1,
          baseTransactions: [
            {
              from: '0xfrom' as Address,
              to: '0xto' as Address,
              data: '0xdata',
              type: 'cip42',
            },
          ],
          throwOnSpendTokenAmountExceedsBalance: false,
        })
      ).resolves.toEqual(expect.anything())
    })
    it("returns a 'not-enough-balance-for-gas' result when the balances for feeCurrencies are too low to cover the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(100),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(1_000))

      // gas fee is 10 * 10k = 100k units, too high for either fee currency

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockSpendToken,
        spendTokenAmount: new BigNumber(45_000),
        decreasedAmountGasFeeMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'not-enough-balance-for-gas',
        feeCurrencies: mockFeeCurrencies,
      })
    })
    it("returns a 'not-enough-balance-for-gas' result when gas estimation throws error due to insufficient funds", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(100),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockRejectedValue(mockInsufficientFundsError)

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockSpendToken,
        spendTokenAmount: new BigNumber(50_000),
        decreasedAmountGasFeeMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'not-enough-balance-for-gas',
        feeCurrencies: mockFeeCurrencies,
      })
    })
    it("returns a 'not-enough-balance-for-gas' result when gas estimation throws error due to value exceeded balance", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(100),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockRejectedValue(mockValueExceededBalanceError)

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockSpendToken,
        spendTokenAmount: new BigNumber(50_000),
        decreasedAmountGasFeeMultiplier: 1,
        baseTransactions: [
          {
            from: '0xfrom' as Address,
            to: '0xto' as Address,
            data: '0xdata',
            type: 'cip42',
          },
        ],
      })
      expect(result).toStrictEqual({
        type: 'not-enough-balance-for-gas',
        feeCurrencies: mockFeeCurrencies,
      })
    })
    it('throws if gas estimation throws error for some other reason besides insufficient funds', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(100),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockRejectedValue(mockExceededAllowanceError)

      await expect(() =>
        prepareTransactions({
          feeCurrencies: mockFeeCurrencies,
          spendToken: mockSpendToken,
          spendTokenAmount: new BigNumber(20),
          decreasedAmountGasFeeMultiplier: 1,
          baseTransactions: [
            {
              from: '0xfrom' as Address,
              to: '0xto' as Address,
              data: '0xdata',
              type: 'cip42',
            },
          ],
        })
      ).rejects.toThrowError(EstimateGasExecutionError)
    })
    it("returns a 'need-decrease-spend-amount-for-gas' result when spending the exact max amount of a feeCurrency, and no other feeCurrency has enough balance to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: BigInt(2),
      })

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[1],
        spendTokenAmount: mockFeeCurrencies[1].balance.shiftedBy(mockFeeCurrencies[1].decimals),
        decreasedAmountGasFeeMultiplier: 1.01,
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
        maxGasFee: new BigNumber('65.65'), // (15k + 50k non-native gas token buffer) * 1.01 multiplier / 1000 feeCurrency1 decimals
        feeCurrency: mockFeeCurrencies[1],
        decreasedSpendAmount: new BigNumber(4.35), // 70.0 balance minus maxGasFee
      })
    })
    it("returns a 'need-decrease-spend-amount-for-gas' result when spending close to the max amount of a feeCurrency, and no other feeCurrency has enough balance to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: BigInt(2),
      })

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[1],
        spendTokenAmount: mockFeeCurrencies[1].balance
          .shiftedBy(mockFeeCurrencies[1].decimals)
          .minus(1), // 69.999k
        decreasedAmountGasFeeMultiplier: 1.01,
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
        maxGasFee: new BigNumber('65.65'), // (15k + 50k non-native gas token buffer) * 1.01 multiplier / 1000 feeCurrency1 decimals
        feeCurrency: mockFeeCurrencies[1],
        decreasedSpendAmount: new BigNumber(4.35), // 70.0 balance minus maxGasFee
      })
    })
    it("returns a 'possible' result when spending a feeCurrency, when there's enough balance to cover for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(500))

      // gas fee is 0.5k units from first transaction, plus 0.1k units from second transaction

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[0],
        spendTokenAmount: new BigNumber(4_000),
        decreasedAmountGasFeeMultiplier: 1,
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
            maxPriorityFeePerGas: BigInt(2),
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: BigInt(2),
          },
        ],
        feeCurrency: mockFeeCurrencies[0],
      })
    })
    it("returns a 'possible' result when spending the max balance of a feeCurrency when there's another feeCurrency to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(500))

      // for fee1 (native): gas fee is 0.5k units from first transaction, plus 0.1k units from second transaction
      // for fee2 (non-native): gas fee is 0.5k units from first transaction, plus 50.1k ((50k * 1) + 0.1k) units from second transaction

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockFeeCurrencies[0],
        spendTokenAmount: mockFeeCurrencies[0].balance.shiftedBy(mockFeeCurrencies[0].decimals),
        decreasedAmountGasFeeMultiplier: 1,
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
            maxPriorityFeePerGas: BigInt(2),
            feeCurrency: mockFeeCurrencies[1].address,
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(50_100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: BigInt(2),
            feeCurrency: mockFeeCurrencies[1].address,
          },
        ],
        feeCurrency: mockFeeCurrencies[1],
      })
    })
    it("returns a 'possible' result when spending the max balance of a token that isn't a feeCurrency when there's another feeCurrency to pay for the fee", async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(500))

      // for fee1 (native): gas fee is 0.5k units from first transaction, plus 0.1k units from second transaction

      const result = await prepareTransactions({
        feeCurrencies: mockFeeCurrencies,
        spendToken: mockSpendToken,
        spendTokenAmount: mockSpendToken.balance.shiftedBy(mockSpendToken.decimals),
        decreasedAmountGasFeeMultiplier: 1,
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
            maxPriorityFeePerGas: BigInt(2),
          },
          {
            from: '0xfrom',
            to: '0xto',
            data: '0xdata',
            type: 'cip42',
            gas: BigInt(100),
            maxFeePerGas: BigInt(1),
            maxPriorityFeePerGas: BigInt(2),
          },
        ],
        feeCurrency: mockFeeCurrencies[0],
      })
    })
  })
  describe('tryEstimateTransaction', () => {
    it('does not include feeCurrency if address is undefined', async () => {
      mockPublicClient.estimateGas.mockResolvedValue(BigInt(123))
      const baseTransaction: TransactionRequestCIP42 = { from: '0x123' }
      const estimateTransactionOutput = await tryEstimateTransaction({
        baseTransaction,
        maxFeePerGas: BigInt(456),
        maxPriorityFeePerGas: BigInt(2),
        feeCurrencySymbol: 'FEE',
      })
      expect(estimateTransactionOutput && 'feeCurrency' in estimateTransactionOutput).toEqual(false)
      expect(estimateTransactionOutput).toStrictEqual({
        from: '0x123',
        gas: BigInt(123),
        maxFeePerGas: BigInt(456),
        maxPriorityFeePerGas: BigInt(2),
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
    it('returns null if estimateGas throws EstimateGasExecutionError with cause insufficient funds', async () => {
      mockPublicClient.estimateGas.mockRejectedValue(mockInsufficientFundsError)
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
    it('throws if estimateGas throws error for some other reason besides insufficient funds', async () => {
      mockPublicClient.estimateGas.mockRejectedValue(mockExceededAllowanceError)
      const baseTransaction: TransactionRequestCIP42 = { from: '0x123' }
      await expect(() =>
        tryEstimateTransaction({
          baseTransaction,
          maxFeePerGas: BigInt(456),
          feeCurrencySymbol: 'FEE',
          feeCurrencyAddress: '0xabc',
          maxPriorityFeePerGas: BigInt(789),
        })
      ).rejects.toThrowError(EstimateGasExecutionError)
    })
  })
  describe('tryEstimateTransactions', () => {
    it('returns null if estimateGas throws error due to insufficient funds', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(10),
        maxPriorityFeePerGas: BigInt(2),
      })
      mockPublicClient.estimateGas.mockRejectedValue(mockInsufficientFundsError)
      const estimateTransactionsOutput = await tryEstimateTransactions(
        [{ from: '0x123' }, { from: '0x123', gas: BigInt(456) }],
        mockFeeCurrencies[0]
      )
      expect(estimateTransactionsOutput).toEqual(null)
    })
    it('estimates gas only for transactions missing a gas field', async () => {
      mocked(estimateFeesPerGas).mockResolvedValue({
        maxFeePerGas: BigInt(10),
        maxPriorityFeePerGas: BigInt(2),
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
          maxPriorityFeePerGas: BigInt(2),
        },
        {
          from: '0x123',
          gas: BigInt(456),
          maxFeePerGas: BigInt(10),
          maxPriorityFeePerGas: BigInt(2),
        },
      ])
    })
  })
  describe('getMaxGasFee', () => {
    it('adds gas times maxFeePerGas', () => {
      expect(
        getMaxGasFee([
          { gas: BigInt(2), maxFeePerGas: BigInt(3), from: '0x123' },
          { gas: BigInt(5), maxFeePerGas: BigInt(7), from: '0x123' },
        ])
      ).toEqual(new BigNumber(41))
    })
    it('throws if gas or maxFeePerGas are missing', () => {
      expect(() =>
        getMaxGasFee([
          { gas: BigInt(2), maxFeePerGas: BigInt(3), from: '0x123' },
          { gas: BigInt(5), from: '0x123' },
        ])
      ).toThrowError('Missing gas or maxFeePerGas')
      expect(() =>
        getMaxGasFee([
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
      decreasedAmountGasFeeMultiplier: 1,
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

  it('prepareTransferWithCommentTransaction', async () => {
    const mockPrepareTransactions = jest.fn()
    mocked(encodeFunctionData).mockReturnValue('0xabc')
    await prepareTransferWithCommentTransaction(
      {
        fromWalletAddress: '0x123',
        toWalletAddress: '0x456',
        sendToken: mockSpendToken,
        amount: BigInt(100),
        feeCurrencies: mockFeeCurrencies,
        comment: 'test comment',
      },
      mockPrepareTransactions
    )
    expect(mockPrepareTransactions).toHaveBeenCalledWith({
      feeCurrencies: mockFeeCurrencies,
      spendToken: mockSpendToken,
      spendTokenAmount: new BigNumber(100),
      decreasedAmountGasFeeMultiplier: 1,
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
      abi: stableToken.abi,
      functionName: 'transferWithComment',
      args: ['0x456', BigInt(100), 'test comment'],
    })
  })

  describe('getFeeCurrencyAndAmount', () => {
    it('returns undefined fee currency and fee amount if prepare transactions result is undefined', () => {
      expect(getFeeCurrencyAndAmount(undefined)).toStrictEqual({
        feeCurrency: undefined,
        feeAmount: undefined,
      })
    })
    it('returns undefined fee currency and fee amount if prepare transactions result is not enough balance for gas', () => {
      expect(
        getFeeCurrencyAndAmount({
          type: 'not-enough-balance-for-gas',
          feeCurrencies: [mockCeloTokenBalance],
        })
      ).toStrictEqual({
        feeCurrency: undefined,
        feeAmount: undefined,
      })
    })
    it('returns fee currency and amount if prepare transactions result is possible', () => {
      expect(
        getFeeCurrencyAndAmount({
          type: 'possible',
          transactions: [
            {
              from: '0xfrom',
              to: '0xto',
              data: '0xdata',
              type: 'cip42',
              gas: BigInt(500),
              maxFeePerGas: BigInt(1),
              maxPriorityFeePerGas: BigInt(2),
            },
            {
              from: '0xfrom',
              to: '0xto',
              data: '0xdata',
              type: 'cip42',
              gas: BigInt(100),
              maxFeePerGas: BigInt(1),
              maxPriorityFeePerGas: BigInt(2),
            },
          ],
          feeCurrency: mockFeeCurrencies[0],
        })
      ).toStrictEqual({
        feeCurrency: mockFeeCurrencies[0],
        feeAmount: new BigNumber(6),
      })
    })
    it('returns fee currency and amount if prepare transactions result is need decrease spend amount for gas', () => {
      expect(
        getFeeCurrencyAndAmount({
          type: 'need-decrease-spend-amount-for-gas',
          feeCurrency: mockCeloTokenBalance,
          maxGasFee: new BigNumber(10).exponentiatedBy(17),
          decreasedSpendAmount: new BigNumber(4),
        })
      ).toStrictEqual({
        feeCurrency: mockCeloTokenBalance,
        feeAmount: new BigNumber(0.1),
      })
    })
  })
})
