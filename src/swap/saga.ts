import { CeloTx } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import { call, put, takeEvery } from 'redux-saga/effects'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { swapApprove, swapError, swapExecute, swapStart, swapSuccess } from 'src/swap/slice'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { applyChainIdWorkaround, buildTxo } from 'src/web3/utils'

const TAG = 'swap/saga'

export function* swapSubmitSaga(data: any) {
  try {
    // Navigate to swap pending screen
    yield call(navigate, Screens.SwapPending)

    // Set contract kit, wallet address and normalizer
    const kit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)
    const normalizer = new TxParamsNormalizer(kit.connection)

    // Approve transaction
    yield put(swapApprove())
    Logger.debug(TAG, `Starting to swap approval for address: ${walletAddress}`)
    const rawApproveTx = { ...data.payload.approveTransaction, from: walletAddress }
    applyChainIdWorkaround(rawApproveTx, yield call([kit.connection, 'chainId']))
    const approveTx: CeloTx = yield call(normalizer.populate.bind(normalizer), rawApproveTx)
    const approveTxo = buildTxo(kit, approveTx)
    yield call(
      sendTransaction,
      approveTxo,
      walletAddress,
      newTransactionContext(TAG, 'Swap/Approve')
    )

    // Query the execute swap endpoint
    const amountType: string = data.payload.userInput.buyAmount ? 'buyAmount' : 'sellAmount'
    const amount = data.payload.unvalidatedSwapTransaction[amountType]
    const params = {
      buyToken: data.payload.unvalidatedSwapTransaction.buyTokenAddress,
      sellToken: data.payload.unvalidatedSwapTransaction.sellTokenAddress,
      [amountType]: amount,
      userAddress: walletAddress,
    }
    const queryParams = new URLSearchParams({ ...params }).toString()
    const requestUrl = `${networkConfig.executeSwapUrl}?${queryParams}`
    const response: Response = yield call(fetchWithTimeout, requestUrl)
    if (!response.ok) {
      Logger.error(TAG, `Swap failed with status: ${response.status}`)
      yield put(swapError())
      return
    }
    const responseJson: { validatedSwapTransaction: any } = yield call([response, 'json'])

    // TODO Tomm: Check the if the results of the approve transaction and within acceptable ranges

    // Execute transaction
    yield put(swapExecute())
    Logger.debug(TAG, `Starting to swap execute for address: ${walletAddress}`)
    const rawExecuteTx = responseJson.validatedSwapTransaction
    applyChainIdWorkaround(rawExecuteTx, yield call([kit.connection, 'chainId']))
    const executeTx: CeloTx = yield call(normalizer.populate.bind(normalizer), rawExecuteTx)
    const executeTxo = buildTxo(kit, executeTx)
    yield call(
      sendTransaction,
      executeTxo,
      walletAddress,
      newTransactionContext(TAG, 'Swap/Execute')
    )

    // TODO Tomm: should we check that transaction was successful on the chain e.g the transaction isn't reverted.
    yield put(swapSuccess())
  } catch (error) {
    Logger.error(TAG, 'Error while swapping', error)
    yield put(swapError())
  }
}

export function* swapSaga() {
  Logger.debug(TAG, 'Initializing swap sagas')
  yield takeEvery(swapStart.type, swapSubmitSaga)
}
