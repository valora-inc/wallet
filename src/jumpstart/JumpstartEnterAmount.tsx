import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { createJumpstartLink } from 'src/firebase/dynamicLinks'
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

  const handleProceed = useAsyncCallback(
    async (parsedAmount: BigNumber, token: TokenBalance) => {
      const link = await createJumpstartLink(jumpstartLink.privateKey, token.networkId)
      return {
        link,
        parsedAmount,
        token,
      }
    },
    {
      onSuccess: ({
        link,
        parsedAmount,
        token,
      }: {
        link: string
        parsedAmount: BigNumber
        token: TokenBalance
      }) => {
        // TODO:
        // 1. Pass the link in a navigation parameter to the
        //    next screen. (use navigateClearingStack so that the user cannot come
        //    back to this screen and reuse the private key)
        // 2. add analytics
      },
      onError: (error) => {
        Logger.error(TAG, 'Error while generating jumpstart dynamic link', error)
      },
    }
  )

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
      onPressProceed={handleProceed.execute}
    />
  )
}

export default JumpstartEnterAmount
