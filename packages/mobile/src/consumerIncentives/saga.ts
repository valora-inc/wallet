import { toTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { all, call, put, spawn, takeEvery } from 'redux-saga/effects'
import merkleDistributor from 'src/abis/MerkleDistributor.json'
import { showError, showMessage } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  claimRewards,
  claimRewardsFailure,
  claimRewardsSuccess,
} from 'src/consumerIncentives/reducer'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import i18n from 'src/i18n'
import { navigateHome } from 'src/navigator/NavigationService'
import { addStandbyTransaction } from 'src/transactions/actions'
import {
  newTransactionContext,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { getContract } from 'src/web3/utils'

const TAG = 'SuperchargeRewardsClaimer'

export function* claimRewardsSaga({ payload: rewards }: ReturnType<typeof claimRewards>) {
  try {
    const kit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)
    const baseNonce: number = yield call(
      // @ts-ignore I can't figure out the syntax for this, it works but TS complains :'(
      [kit.web3.eth, kit.web3.eth.getTransactionCount],
      walletAddress
    )

    const receivedRewards: {
      fundsSource: string
      amount: string
      tokenAddress: string
      txHash: string
    }[] = yield all(
      rewards.map(async (reward, index) => {
        const merkleContract = await getContract(merkleDistributor.abi, reward.contractAddress)
        const fundsSource = await merkleContract.methods.fundsSource().call()

        const claimTx = toTransactionObject(
          kit.connection,
          merkleContract.methods.claim(reward.index, walletAddress, reward.amount, reward.proof)
        )

        const receipt = await claimTx.sendAndWaitForReceipt({
          from: walletAddress,
          nonce: baseNonce + index,
        })
        Logger.info(TAG, 'Claimed reward: ', JSON.stringify(receipt))
        return {
          fundsSource: fundsSource.toLowerCase(),
          tokenAddress: reward.tokenAddress.toLowerCase(),
          amount: new BigNumber(reward.amount, 16).div(WEI_PER_TOKEN).toString(),
          txHash: receipt.transactionHash,
        }
      })
    )
    for (const reward of receivedRewards) {
      yield put(
        addStandbyTransaction({
          context: newTransactionContext('Claim Reward', reward.txHash),
          type: TokenTransactionTypeV2.Received,
          status: TransactionStatus.Complete,
          value: reward.amount,
          tokenAddress: reward.tokenAddress,
          comment: '',
          timestamp: Math.floor(Date.now() / 1000),
          address: reward.fundsSource,
          hash: reward.txHash,
        })
      )
    }
    yield put(claimRewardsSuccess())
    yield put(showMessage(i18n.t('superchargeClaimSuccess')))
    navigateHome()
  } catch (error) {
    yield put(claimRewardsFailure())
    yield put(showError(ErrorMessages.SUPERCHARGE_CLAIM_FAILED))
    Logger.error(TAG, 'Error claiming rewards', error.message)
  }
}

export function* watchClaimRewards() {
  yield takeEvery(claimRewards.type, claimRewardsSaga)
}

export function* superchargeSaga() {
  yield spawn(watchClaimRewards)
}
