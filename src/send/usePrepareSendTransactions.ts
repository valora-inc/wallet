import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import erc20 from 'src/abis/IERC20'
import jumpstart from 'src/abis/IWalletJumpstart'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { tokenAmountInSmallestUnit } from 'src/tokens/saga'
import { TokenBalance, isNativeTokenBalance, tokenBalanceHasAddress } from 'src/tokens/slice'
import { tokenSupportsComments } from 'src/tokens/utils'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import {
  TransactionRequest,
  prepareERC20TransferTransaction,
  prepareSendNativeAssetTransaction,
  prepareTransactions,
  prepareTransferWithCommentTransaction,
} from 'src/viem/prepareTransactions'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, encodeFunctionData } from 'viem'

const TAG = 'src/send/usePrepareSendTransactions'

async function createBaseJumpstartTransactions(
  jumpstartContractAddress: string,
  spendTokenAmount: BigNumber,
  spendTokenAddress: string,
  networkId: NetworkId,
  walletAddress: string,
  publicKey: string
) {
  const baseTransactions: TransactionRequest[] = []
  const spendAmount = BigInt(spendTokenAmount.toFixed(0))

  const approvedAllowanceForSpender = await publicClient[
    networkIdToNetwork[networkId]
  ].readContract({
    address: spendTokenAddress as Address,
    abi: erc20.abi,
    functionName: 'allowance',
    args: [walletAddress as Address, jumpstartContractAddress as Address],
  })

  if (approvedAllowanceForSpender < spendAmount) {
    const approveTx: TransactionRequest = {
      from: walletAddress as Address,
      to: spendTokenAddress as Address,
      data: encodeFunctionData({
        abi: erc20.abi,
        functionName: 'approve',
        args: [jumpstartContractAddress as Address, spendAmount],
      }),
    }
    baseTransactions.push(approveTx)
  }

  const transferTx: TransactionRequest = {
    from: walletAddress as Address,
    to: jumpstartContractAddress as Address,
    value: BigInt(0),
    data: encodeFunctionData({
      abi: jumpstart.abi,
      functionName: 'depositERC20',
      args: [publicKey as Address, spendTokenAddress as Address, spendAmount],
    }),
  }
  baseTransactions.push(transferTx)

  return baseTransactions
}

export enum PrepareSendTransactionType {
  TRANSFER = 'transfer',
  JUMPSTART = 'jumpstart',
}
export type PrepareTransferTransactionsInput = {
  transactionType: PrepareSendTransactionType.TRANSFER
  recipientAddress: string
  comment?: string
  amount: BigNumber
  token: TokenBalance
  walletAddress: string
  feeCurrencies: TokenBalance[]
}
type PrepareJumpstartTransactionsInput = {
  transactionType: PrepareSendTransactionType.JUMPSTART
  publicKey: string
  amount: BigNumber
  token: TokenBalance
  walletAddress: string
  feeCurrencies: TokenBalance[]
}

export async function prepareSendTransactionsCallback(
  input: PrepareJumpstartTransactionsInput | PrepareTransferTransactionsInput
) {
  const { amount, token, walletAddress, feeCurrencies } = input
  if (amount.isLessThanOrEqualTo(0)) {
    return
  }

  if (input.transactionType === PrepareSendTransactionType.JUMPSTART) {
    const { address, networkId, tokenId } = token
    if (!address) {
      throw new Error(`jumpstart send token ${tokenId} has undefined address`)
    }

    const jumpstartContractAddress = getDynamicConfigParams(
      DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]
    ).jumpstartContracts?.[networkId]?.contractAddress
    if (!jumpstartContractAddress) {
      throw new Error(
        `jumpstart contract for send token ${tokenId} on network ${networkId} is not provided in dynamic config`
      )
    }

    const baseTransactions = await createBaseJumpstartTransactions(
      jumpstartContractAddress,
      amount,
      address,
      networkId,
      walletAddress,
      input.publicKey
    )
    return prepareTransactions({
      feeCurrencies,
      spendToken: token,
      spendTokenAmount: amount,
      baseTransactions,
    })
  }

  const { recipientAddress, comment } = input
  const baseTransactionParams = {
    // not including sendToken yet because of typing. need to check whether token has address field or not first, required for erc-20 transfers
    fromWalletAddress: walletAddress,
    toWalletAddress: recipientAddress,
    amount: BigInt(tokenAmountInSmallestUnit(amount, token.decimals)),
    feeCurrencies,
  }
  if (tokenBalanceHasAddress(token)) {
    // NOTE: CELO will be sent as ERC-20. This makes analytics easier, but if gas prices increase later on and/or we
    //   gain analytics coverage for native CELO transfers, we could switch to sending CELO as native asset to save on gas
    const transactionParams = { ...baseTransactionParams, sendToken: token, comment }
    if (tokenSupportsComments(token)) {
      return prepareTransferWithCommentTransaction(transactionParams)
    } else {
      return prepareERC20TransferTransaction(transactionParams)
    }
  } else if (isNativeTokenBalance(token)) {
    return prepareSendNativeAssetTransaction({
      ...baseTransactionParams,
      sendToken: token,
    })
  } else {
    Logger.error(
      TAG,
      `Token does not have address AND is not native. token: ${JSON.stringify(token)}}`
    )
  }
}

/**
 * Hook to prepare transactions for sending crypto.
 */
export function usePrepareSendTransactions() {
  const prepareTransactions = useAsyncCallback(prepareSendTransactionsCallback, {
    onError: (error) => {
      Logger.error(TAG, `prepareTransactionsOutput: ${error}`)
    },
  })

  return {
    prepareTransactionsResult: prepareTransactions.result,
    refreshPreparedTransactions: prepareTransactions.execute,
    clearPreparedTransactions: prepareTransactions.reset,
    prepareTransactionError: prepareTransactions.error,
  }
}
