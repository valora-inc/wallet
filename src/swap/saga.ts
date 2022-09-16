import { ContractKit } from '@celo/contractkit'
import { call, takeEvery } from 'redux-saga/effects'
import { walletToAccountAddressSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { swapStart } from 'src/swap/slice'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { TransactionConfig } from 'web3-core'

const TAG = 'swap/saga'

// TODO Tomm: create a real type for this...
// TODO Tomm: handle state changes - Approve Funds - Complete Swap - etc
function* SwapSaga(data: any) {
  try {
    // Navigate to completeSwap screen
    yield call(navigate, Screens.SwapPending)

    // Get contract kit, wallet address and
    const kit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)

    // Call approveTransaction
    Logger.debug(TAG, `Starting to swap approval for address: ${walletAddress}`)
    kit.web3.eth.sendTransaction({
      ...data.payload.approveTransaction,
      from: walletAddress,
    } as TransactionConfig)

    // TODO Tomm: Check the if the results of the approve transaction and within acceptable ranges and if not cancel
    // console.log('estimated price impact', data.payload.unvalidatedSwapTransaction.estimatedPriceImpact)

    // Query the execute swap endpoint
    // TODO Tomm: debug why buyAmount works and sellAmount does not
    const amountType: string = data.payload.userInput.buyAmount ? 'buyAmount' : 'sellAmount'
    const amount = data.payload.unvalidatedSwapTransaction[amountType]
    // console.log('Tom - params - sellAmount, buyAmount',
    //   data.payload.unvalidatedSwapTransaction.sellAmount,
    //   data.payload.unvalidatedSwapTransaction.buyAmount
    // )
    const params = {
      buyToken: data.payload.unvalidatedSwapTransaction.buyTokenAddress,
      sellToken: data.payload.unvalidatedSwapTransaction.sellTokenAddress,
      [amountType]: amount,
      userAddress: walletAddress,
    }

    console.log('Tom - params', params)
    const queryParams = new URLSearchParams({ ...params }).toString()
    const requestUrl = `${networkConfig.executeSwapUrl}?${queryParams}`
    const response: Response = yield call(fetchWithTimeout, requestUrl)
    const responseJson: any = yield call([response, response.json])

    // Send the transaction to execute the swap
    kit.web3.eth.sendTransaction({
      ...responseJson.validatedSwapTransaction,
      from: walletToAccountAddressSelector,
    } as TransactionConfig)
  } catch (error) {
    Logger.error(TAG, 'Error while swapping', error)
  }
}

export function* swapSaga() {
  Logger.debug(TAG, 'Initializing swap sagas')
  yield takeEvery(swapStart.type, SwapSaga)
}
