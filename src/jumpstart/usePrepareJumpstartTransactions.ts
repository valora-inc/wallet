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
  sendTokenAmountInSmallestUnit: BigNumber,
  spendTokenAddress: string,
  networkId: NetworkId,
  walletAddress: string,
  publicKey: string,
  depositERC20GasEstimate: string
) {
  const baseTransactions: TransactionRequest[] = []
  const spendAmount = BigInt(sendTokenAmountInSmallestUnit.toFixed(0, 0))

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
    gas: BigInt(depositERC20GasEstimate),
  }
  baseTransactions.push(transferTx)

  return baseTransactions
}

export function usePrepareJumpstartTransactions() {
  return useAsyncCallback(
    async ({
      sendTokenAmountInSmallestUnit,
      token,
      walletAddress,
      feeCurrencies,
      publicKey,
    }: {
      publicKey: string
      sendTokenAmountInSmallestUnit: BigNumber
      token: TokenBalance
      walletAddress: string
      feeCurrencies: TokenBalance[]
    }) => {
      if (sendTokenAmountInSmallestUnit.isLessThanOrEqualTo(0)) {
        return
      }

      const { address, networkId, tokenId } = token
      if (!address) {
        throw new Error(`jumpstart send token ${tokenId} has undefined address`)
      }

      const jumpstartContractConfig = getDynamicConfigParams(
        DynamicConfigs[StatsigDynamicConfigs.WALLET_JUMPSTART_CONFIG]
      ).jumpstartContracts?.[networkId]
      if (
        !jumpstartContractConfig?.contractAddress ||
        !jumpstartContractConfig?.depositERC20GasEstimate
      ) {
        throw new Error(
          `jumpstart contract address or deposit gas estimate on network ${networkId} is not provided in dynamic config`
        )
      }

      const baseTransactions = await createBaseJumpstartTransactions(
        jumpstartContractConfig.contractAddress,
        sendTokenAmountInSmallestUnit,
        address,
        networkId,
        walletAddress,
        publicKey,
        jumpstartContractConfig.depositERC20GasEstimate
      )

      return prepareTransactions({
        feeCurrencies,
        spendToken: token,
        spendTokenAmount: sendTokenAmountInSmallestUnit,
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
