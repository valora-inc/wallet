import { ContractKit } from '@celo/contractkit'
import { call, put, takeEvery } from 'redux-saga/effects'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { swapApprove, swapError, swapExecute, swapStart, swapSuccess } from 'src/swap/slice'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { TransactionConfig } from 'web3-core'

const TAG = 'swap/saga'

// TODO Tomm: create a real types
function* SwapSaga(data: any) {
  try {
    // Navigate to completeSwap screen
    yield call(navigate, Screens.SwapPending)

    // Get contract kit, wallet address and
    const kit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)

    // Approve Transaction - TODO handle fees not paid in CELO
    yield put(swapApprove())
    Logger.debug(TAG, `Starting to swap approval for address: ${walletAddress}`)
    yield call(kit.web3.eth.sendTransaction, {
      ...data.payload.approveTransaction,
      from: walletAddress,
    } as TransactionConfig)

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
    const responseJson = yield call([response, response.json])

    // TODO Tomm: Check the if the results of the approve transaction and within acceptable ranges

    // Execute Swap - TODO handle fees not paid in CELO
    yield put(swapExecute())
    yield call(kit.web3.eth.sendTransaction, {
      ...responseJson.validatedSwapTransaction,
      from: walletAddress,
    } as TransactionConfig)

    // TODO Tomm: should we check that transaction was successful on the chain e.g the transaction isn't reverted.
    yield put(swapSuccess())
  } catch (error) {
    Logger.error(TAG, 'Error while swapping', error)
    yield put(swapError())
  }
}

export function* swapSaga() {
  Logger.debug(TAG, 'Initializing swap sagas')
  yield takeEvery(swapStart.type, SwapSaga)
}
