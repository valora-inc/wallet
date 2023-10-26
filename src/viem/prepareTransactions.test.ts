import BigNumber from 'bignumber.js'
import { Network, NetworkId } from 'src/transactions/types'
import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { Address } from 'viem'
import { estimateFeesPerGas } from 'src/viem/estimateFeesPerGas'
import { publicClient } from 'src/viem/index'
import mocked = jest.mocked

jest.mock('src/viem/estimateFeesPerGas')

describe('prepareTransactions', () => {
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
