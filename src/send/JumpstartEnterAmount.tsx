import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo } from 'react'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import EnterAmount from 'src/send/EnterAmount'
import { usePrepareJumpstartTransactions } from 'src/send/usePrepareJumpstartTransactions'
import { jumpstartSendTokensSelector } from 'src/tokens/selectors'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const TAG = 'JumpstartEnterAmount'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartEnterAmount>

function JumpstartEnterAmount({ route }: Props) {
  const walletAddress = useSelector(walletAddressSelector)
  const tokens = useSelector(jumpstartSendTokensSelector)
  const defaultToken = useMemo(() => {
    const defaultTokenId = route.params?.defaultTokenId
    return defaultTokenId
      ? tokens.find((token) => token.tokenId === defaultTokenId) ?? tokens[0]
      : tokens[0]
  }, [route])

  const jumpstartLink = useMemo(() => {
    const privateKey = generatePrivateKey()
    const publicKey = privateKeyToAccount(privateKey).address
    return {
      publicKey,
      privateKey,
    }
  }, [])

  const handleSendAndGenerateLink = (parsedAmount: BigNumber, token: TokenBalance) => {
    // TODO
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
      defaultToken={defaultToken}
      prepareTransactionsResult={prepareJumpstartTransactions.result}
      onClearPreparedTransactions={prepareJumpstartTransactions.reset}
      onRefreshPreparedTransactions={handlRefreshPreparedTransactions}
      prepareTransactionError={prepareJumpstartTransactions.error}
      onPressProceed={handleSendAndGenerateLink}
    />
  )
}

export default JumpstartEnterAmount
