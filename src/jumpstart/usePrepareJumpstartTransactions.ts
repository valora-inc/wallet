import BigNumber from 'bignumber.js'
import { useAsyncCallback } from 'react-async-hook'
import erc20 from 'src/abis/IERC20'
import jumpstart from 'src/abis/IWalletJumpstart'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { TokenBalance } from 'src/tokens/slice'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, encodeFunctionData } from 'viem'

const TAG = 'src/send/usePrepareJumpstartTransactions'

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

export function usePrepareJumpstartTransactions() {
  return useAsyncCallback(
    async ({
      amount,
      token,
      walletAddress,
      feeCurrencies,
      publicKey,
    }: {
      publicKey: string
      amount: BigNumber
      token: TokenBalance
      walletAddress: string
      feeCurrencies: TokenBalance[]
    }) => {
      if (amount.isLessThanOrEqualTo(0)) {
        return
      }

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
        publicKey
      )
      return prepareTransactions({
        feeCurrencies,
        spendToken: token,
        spendTokenAmount: amount,
        baseTransactions,
      })
    },
    {
      onError: (error) => {
        Logger.error(TAG, `prepareTransactionsOutput: ${error}`)
      },
    }
  )
}
