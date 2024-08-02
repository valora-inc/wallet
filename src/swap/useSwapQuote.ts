import { Squid as SquidSdk } from '@0xsquid/sdk'
import { ChainType, Estimate, RouteRequest } from '@0xsquid/sdk/dist/types'
import { valueToBigNumber } from '@celo/contractkit/lib/wrappers/BaseWrapper'
import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import aavePool from 'src/abis/AavePoolV3'
import erc20 from 'src/abis/IERC20'
import { useSelector } from 'src/redux/hooks'
import {
  FetchQuoteResponse,
  Field,
  ParsedSwapAmount,
  SwapTransaction,
  SwapType,
} from 'src/swap/types'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import {
  PreparedTransactionsResult,
  TransactionRequest,
  prepareTransactions,
} from 'src/viem/prepareTransactions'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, Hex, encodeFunctionData, zeroAddress } from 'viem'

// Apply a multiplier for the decreased swap amount to account for the
// varying gas fees of different swap providers (or even the same swap)
const DECREASED_SWAP_AMOUNT_GAS_FEE_MULTIPLIER = 1.2

export const NO_QUOTE_ERROR_MESSAGE = 'No quote available'

interface BaseQuoteResult {
  swapType: SwapType
  toTokenId: string
  fromTokenId: string
  swapAmount: BigNumber
  price: string
  provider: string
  estimatedPriceImpact: string | null
  preparedTransactions: PreparedTransactionsResult
  receivedAt: number
  allowanceTarget: string
  appFeePercentageIncludedInPrice: string | undefined
  sellAmount: string
}

interface SameChainQuoteResult extends BaseQuoteResult {
  swapType: 'same-chain'
}

interface CrossChainQuoteResult extends BaseQuoteResult {
  swapType: 'cross-chain'
  estimatedDurationInSeconds: number
  maxCrossChainFee: string
  estimatedCrossChainFee: string
}

export type QuoteResult = SameChainQuoteResult | CrossChainQuoteResult

async function createBaseSwapTransactions(
  fromToken: TokenBalance,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  walletAddress: string
) {
  const baseTransactions: TransactionRequest[] = []

  const {
    guaranteedPrice,
    buyAmount,
    sellAmount,
    allowanceTarget,
    from,
    to,
    value,
    data,
    gas,
    estimatedGasUse,
  } = unvalidatedSwapTransaction
  const amountType: string =
    updatedField === Field.TO ? ('buyAmount' as const) : ('sellAmount' as const)

  const amountToApprove =
    amountType === 'buyAmount'
      ? BigInt(new BigNumber(buyAmount).times(guaranteedPrice).toFixed(0, 0))
      : BigInt(sellAmount)

  // If the sell token is ERC-20, we need to check the allowance and add an
  // approval transaction if necessary
  if (allowanceTarget !== zeroAddress && fromToken.address) {
    const approvedAllowanceForSpender = await publicClient[
      networkIdToNetwork[fromToken.networkId]
    ].readContract({
      address: fromToken.address as Address,
      abi: erc20.abi,
      functionName: 'allowance',
      args: [walletAddress as Address, allowanceTarget as Address],
    })

    if (approvedAllowanceForSpender < amountToApprove) {
      const data = encodeFunctionData({
        abi: erc20.abi,
        functionName: 'approve',
        args: [allowanceTarget as Address, amountToApprove],
      })

      const approveTx: TransactionRequest = {
        from: from as Address,
        to: fromToken.address as Address,
        data,
      }
      baseTransactions.push(approveTx)
    }
  }

  const swapTx: TransactionRequest & { gas: bigint } = {
    from: from as Address,
    to: to as Address,
    value: BigInt(value ?? 0),
    data: data as Hex,
    // This may not be entirely accurate for now
    // without the approval transaction being executed first.
    // See https://www.notion.so/valora-inc/Fee-currency-selection-logic-4c207244893748bd85e23b754334f42d?pvs=4#8b7c27d31ebf4fca981f81e9411f86ee
    // We control this from our API.
    gas: BigInt(gas),
    // This is the estimated gas use returned by the API.
    _estimatedGasUse: estimatedGasUse != null ? BigInt(estimatedGasUse) : undefined,
  }
  baseTransactions.push(swapTx)

  return {
    amountToApprove,
    baseTransactions,
  }
}

async function prepareSwapTransactions(
  fromToken: TokenBalance,
  updatedField: Field,
  unvalidatedSwapTransaction: SwapTransaction,
  feeCurrencies: TokenBalance[],
  walletAddress: string
): Promise<PreparedTransactionsResult> {
  const { amountToApprove, baseTransactions } = await createBaseSwapTransactions(
    fromToken,
    updatedField,
    unvalidatedSwapTransaction,
    walletAddress
  )
  return prepareTransactions({
    feeCurrencies,
    spendToken: fromToken,
    spendTokenAmount: new BigNumber(amountToApprove.toString()),
    decreasedAmountGasFeeMultiplier: DECREASED_SWAP_AMOUNT_GAS_FEE_MULTIPLIER,
    baseTransactions,
    // We still want to prepare the transactions even if the user doesn't have enough balance
    throwOnSpendTokenAmountExceedsBalance: false,
    origin: 'swap',
  })
}

async function getSquidPostHookQuote(
  fromToken: TokenBalance,
  toToken: TokenBalance,
  sellAmount: string,
  walletAddress: Address
): Promise<FetchQuoteResponse | undefined> {
  if (
    fromToken.networkId !== NetworkId['celo-mainnet'] ||
    toToken.networkId !== NetworkId['arbitrum-one'] ||
    toToken.symbol !== 'USDC'
  ) {
    console.log('Squid: Unsupported network or token', fromToken.networkId, toToken.networkId)
    return
  }

  const approveData = encodeFunctionData({
    abi: erc20.abi,
    functionName: 'approve',
    args: [networkConfig.arbAavePoolV3ContractAddress, BigInt(0)],
  })

  const supplyData = encodeFunctionData({
    abi: aavePool,
    functionName: 'supply',
    args: [toToken.address as Address, BigInt(0), walletAddress, 0],
  })

  const params: RouteRequest = {
    fromChain: '42220',
    fromToken: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    fromAmount: sellAmount,
    toChain: '42161',
    toToken: toToken.address!,
    fromAddress: walletAddress,
    toAddress: walletAddress,
    postHook: {
      chainType: ChainType.EVM,
      calls: [
        {
          callType: 1,
          target: toToken.address as Address,
          callData: approveData,
          estimatedGas: '50000',
          chainType: ChainType.EVM,
          payload: {
            tokenAddress: toToken.address!,
            inputPos: 1,
          },
          value: '0',
        },
        // {
        //   callType: 1,
        //   target: networkConfig.arbAavePoolV3ContractAddress,
        //   callData: supplyData,
        //   estimatedGas: '50000',
        //   chainType: ChainType.EVM,
        //   payload: {
        //     tokenAddress: toToken.address!,
        //     inputPos: 1,
        //   },
        //   value: '0',
        // },
      ],
      description: 'Test arb post hook',
      provider: 'Test',
      logoURI: 'https://valoraapp.com/favicon.ico',
    },
  }

  const squidSdk = new SquidSdk({
    baseUrl: 'https://apiplus.squidrouter.com',
    integratorId: '',
    timeout: 5000,
  })

  await squidSdk.init()

  console.log('init squid sdk')

  const { route } = await squidSdk.getRoute(params)

  console.log('Squid route', route)

  const gasCosts = route.estimate.gasCosts[0]
  const prices = calculatePrices(route.estimate)

  const { transactionRequest } = route
  if (!transactionRequest) {
    throw new Error('Squid: route is missing transactionRequest')
  }

  const swapQuote = {
    chainId: 42220,
    buyAmount: route.estimate.toAmount,
    sellAmount: route.estimate.fromAmount,
    buyTokenAddress: toToken.address!,
    sellTokenAddress: fromToken.address!,
    price: prices.price,
    guaranteedPrice: prices.guaranteedPrice,
    estimatedPriceImpact: route.estimate.aggregatePriceImpact,
    gas: gasCosts.gasLimit,
    gasPrice: valueToBigNumber(gasCosts.amount)
      .dividedBy(valueToBigNumber(gasCosts.gasLimit))
      .toString(10),
    to: transactionRequest.target,
    value: transactionRequest.value,
    data: transactionRequest.data,
    from: walletAddress,
    allowanceTarget: transactionRequest.target,
    estimatedGasUse: valueToBigNumber(gasCosts.gasLimit).times(0.75).toFixed(0),
    appFeePercentageIncludedInPrice: '0',
  }

  console.log('Squid quote', swapQuote)

  return {
    unvalidatedSwapTransaction: {
      ...swapQuote,
      swapType: 'cross-chain',
      ...crossChainSwapProperties(route.estimate),
    },
    details: {
      swapProvider: 'Squid',
    },
  }
}

function crossChainSwapProperties(estimate: Estimate) {
  const sourceNetworkNativeToken = '0x471EcE3750Da237f93B8E339c536989b8978a438'

  let maxCrossChainFee = BigInt(0)
  if (estimate.feeCosts) {
    for (const feeCost of estimate.feeCosts) {
      const { amount, token, name: feeName, description: feeDescription } = feeCost

      if (token.address.toLowerCase() === sourceNetworkNativeToken) {
        maxCrossChainFee += BigInt(amount ?? 0)
      } else {
        console.log('Unexpected cross-chain swap fee token', {
          feeTokenAddress: token.address,
          feeName,
          feeDescription,
        })
      }
    }
  }
  const estimatedCrossChainGasRefund = (maxCrossChainFee * BigInt(25)) / BigInt(100)
  const estimatedCrossChainFee = maxCrossChainFee - estimatedCrossChainGasRefund

  return {
    estimatedDuration: estimate.estimatedRouteDuration,
    maxCrossChainFee: maxCrossChainFee.toString(),
    estimatedCrossChainFee: estimatedCrossChainFee.toString(),
  }
}

function calculatePrices(estimate: Estimate) {
  // Price is the price of sellToken (or fromToken) in buyToken (or toToken).
  // I.e., how many buyTokens the user gets for 1 sellToken.
  return {
    price: valueToBigNumber(estimate.toAmount)
      .shiftedBy(-estimate.toToken.decimals)
      .dividedBy(valueToBigNumber(estimate.fromAmount).shiftedBy(-estimate.fromToken.decimals))
      .toString(10),
    guaranteedPrice: valueToBigNumber(estimate.toAmountMin)
      .shiftedBy(-estimate.toToken.decimals)
      .dividedBy(valueToBigNumber(estimate.fromAmount).shiftedBy(-estimate.fromToken.decimals))
      .toString(10),
  }
}

function useSwapQuote({
  networkId,
  slippagePercentage,
  enableAppFee,
}: {
  networkId: NetworkId
  slippagePercentage: string
  enableAppFee: boolean
}) {
  const walletAddress = useSelector(walletAddressSelector)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, networkId))

  const refreshQuote = useAsyncCallback(
    async (
      fromToken: TokenBalance,
      toToken: TokenBalance,
      swapAmount: ParsedSwapAmount,
      updatedField: Field
    ): Promise<QuoteResult | null> => {
      if (!walletAddress) {
        // should never happen
        Logger.error('SwapScreen@useSwapQuote', 'No wallet address found when refreshing quote')
        return null
      }

      if (!swapAmount[updatedField].gt(0)) {
        return null
      }

      const decimals = updatedField === Field.FROM ? fromToken.decimals : toToken.decimals
      const swapAmountInWei = new BigNumber(swapAmount[updatedField]).shiftedBy(decimals)
      if (swapAmountInWei.lte(0)) {
        return null
      }

      const swapAmountParam = updatedField === Field.FROM ? 'sellAmount' : 'buyAmount'
      const params = {
        ...(toToken.address && { buyToken: toToken.address }),
        buyIsNative: (toToken.isNative ?? false).toString(),
        buyNetworkId: toToken.networkId,
        ...(fromToken.address && { sellToken: fromToken.address }),
        sellIsNative: (fromToken.isNative ?? false).toString(),
        sellNetworkId: fromToken.networkId,
        [swapAmountParam]: swapAmountInWei.toFixed(0, BigNumber.ROUND_DOWN),
        userAddress: walletAddress ?? '',
        slippagePercentage,
        ...(enableAppFee === true && { enableAppFee: enableAppFee.toString() }),
      }
      const queryParams = new URLSearchParams({ ...params }).toString()
      const requestUrl = `${networkConfig.getSwapQuoteUrl}?${queryParams}`
      const response = await fetch(requestUrl)

      if (!response.ok) {
        throw new Error(await response.text())
      }

      let quote: FetchQuoteResponse | undefined

      quote = await getSquidPostHookQuote(
        fromToken,
        toToken,
        swapAmountInWei.toFixed(),
        walletAddress as Address
      )

      if (!quote) {
        quote = await response.json()
      }

      if (!quote || !quote.unvalidatedSwapTransaction) {
        throw new Error(NO_QUOTE_ERROR_MESSAGE)
      }

      const swapPrice = quote.unvalidatedSwapTransaction.price
      const price =
        updatedField === Field.FROM
          ? swapPrice
          : new BigNumber(1).div(new BigNumber(swapPrice)).toFixed()
      const estimatedPriceImpact = quote.unvalidatedSwapTransaction.estimatedPriceImpact
      const preparedTransactions = await prepareSwapTransactions(
        fromToken,
        updatedField,
        quote.unvalidatedSwapTransaction,
        feeCurrencies,
        walletAddress
      )

      const baseQuoteResult: BaseQuoteResult = {
        swapType: quote.unvalidatedSwapTransaction.swapType,
        toTokenId: toToken.tokenId,
        fromTokenId: fromToken.tokenId,
        swapAmount: swapAmount[updatedField],
        price,
        provider: quote.details.swapProvider,
        estimatedPriceImpact,
        preparedTransactions,
        receivedAt: Date.now(),
        appFeePercentageIncludedInPrice:
          quote.unvalidatedSwapTransaction.appFeePercentageIncludedInPrice,
        allowanceTarget: quote.unvalidatedSwapTransaction.allowanceTarget,
        sellAmount: quote.unvalidatedSwapTransaction.sellAmount,
      }

      if (quote.unvalidatedSwapTransaction.swapType === 'cross-chain') {
        return {
          ...baseQuoteResult,
          estimatedDurationInSeconds: quote.unvalidatedSwapTransaction.estimatedDuration,
          maxCrossChainFee: quote.unvalidatedSwapTransaction.maxCrossChainFee,
          estimatedCrossChainFee: quote.unvalidatedSwapTransaction.estimatedCrossChainFee,
        }
      } else {
        return baseQuoteResult as SameChainQuoteResult
      }
    },
    {
      // Keep last result when refreshing
      setLoading: (state) => ({ ...state, loading: true }),
      onError: (error: Error) => {
        Logger.warn('SwapScreen@useSwapQuote', 'error from approve swap url', error)
      },
    }
  )

  const clearQuote = () => {
    refreshQuote.reset()
  }

  return {
    quote: refreshQuote.result ?? null,
    refreshQuote: refreshQuote.execute,
    fetchSwapQuoteError: refreshQuote.error,
    fetchingSwapQuote: refreshQuote.loading,
    clearQuote,
  }
}

export default useSwapQuote
