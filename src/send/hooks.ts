import { TokenBalance, TokenBalanceWithAddress } from 'src/tokens/slice'
import { PreparedTransactionsResult, prepareTransactions } from 'src/viem/prepareTransactions'
import { TransactionRequestCIP42 } from 'node_modules/viem/_types/chains/celo/types'
import { Address, encodeFunctionData } from 'viem'
import erc20 from 'src/abis/IERC20'
import BigNumber from 'bignumber.js'

/**
 * Prepare a transaction for sending an ERC-20 token.
 *
 * Works for ERC-20 and native transfers.
 *
 * NOTE: does not include fees for registering a DEK before sending a c-stable, since that is a different transaction.
 *
 */
export async function prepareSendERC20Transaction(
  fromWalletAddress: string,
  toWalletAddress: string,
  sendToken: TokenBalanceWithAddress,
  amountWei: bigint,
  feeCurrencies: TokenBalance[]
): Promise<PreparedTransactionsResult> {
  // TODO make this work for transfer with comment
  const baseSendTx: TransactionRequestCIP42 = {
    from: fromWalletAddress as Address,
    to: sendToken.address as Address,
    data: encodeFunctionData({
      abi: erc20.abi,
      functionName: 'transfer',
      args: [toWalletAddress as Address, amountWei],
    }),
    type: 'cip42',
  }
  return prepareTransactions({
    feeCurrencies,
    spendToken: sendToken,
    spendTokenAmount: new BigNumber(amountWei.toString()),
    decreasedAmountGasCostMultiplier: 1,
    baseTransactions: [baseSendTx],
  })
}
