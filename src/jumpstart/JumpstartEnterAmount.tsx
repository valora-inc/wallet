import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { usePrepareJumpstartTransactions } from 'src/jumpstart/usePrepareJumpstartTransactions'
import useSelector from 'src/redux/useSelector'
import EnterAmount from 'src/send/EnterAmount'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const TAG = 'JumpstartEnterAmount'

function JumpstartEnterAmount() {
  const walletAddress = useSelector(walletAddressSelector)
  const tokens = useSelector(jumpstartSendTokensSelector)

  const jumpstartLink = useMemo(() => {
    const privateKey = generatePrivateKey()
    const publicKey = privateKeyToAccount(privateKey).address
    return {
      publicKey,
      privateKey,
    }
  }, [])

  const handleSendAndGenerateLink = (parsedAmount: BigNumber, token: TokenBalance) => {
    // TODO:
    // 1. Send the transaction, probably by dispatching an action and letting a
    //    saga handle it.
    // 2. Generate the link and pass the link in a navigation parameter to the
    //    next screen. (use navigateClearingStack so that the user cannot come
    //    back to this screen and reuse the private key)
    // 3. add analytics
  }

  const prepareJumpstartTransactions = usePrepareJumpstartTransactions()

  const handlRefreshPreparedTransactions = (
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ) => {
    if (!walletAddress) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }

    return prepareJumpstartTransactions.execute({
      amount,
      token,
      walletAddress,
      feeCurrencies,
      publicKey: jumpstartLink.publicKey,
    })
  }

  return (
    <EnterAmount
      tokens={tokens}
      prepareTransactionsResult={prepareJumpstartTransactions.result}
      onClearPreparedTransactions={prepareJumpstartTransactions.reset}
      onRefreshPreparedTransactions={handlRefreshPreparedTransactions}
      prepareTransactionError={prepareJumpstartTransactions.error}
      onPressProceed={handleSendAndGenerateLink}
    />
  )
}

export default JumpstartEnterAmount
