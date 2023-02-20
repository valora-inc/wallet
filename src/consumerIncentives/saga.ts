import { CeloTx, CeloTxReceipt } from '@celo/connect'
import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import { ContractKit } from '@celo/contractkit'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, takeEvery } from 'redux-saga/effects'
import { showError, showMessage } from 'src/alert/actions'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { superchargeRewardContractAddressSelector } from 'src/consumerIncentives/selectors'
import {
  claimRewards,
  claimRewardsFailure,
  claimRewardsSuccess,
  fetchAvailableRewards,
  fetchAvailableRewardsFailure,
  fetchAvailableRewardsSuccess,
  setAvailableRewards,
} from 'src/consumerIncentives/slice'
import { SuperchargePendingReward } from 'src/consumerIncentives/types'
import i18n from 'src/i18n'
import { navigateHome } from 'src/navigator/NavigationService'
import { tokensByAddressSelector } from 'src/tokens/selectors'
import { TokenBalances } from 'src/tokens/slice'
import { addStandbyTransaction } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import {
  newTransactionContext,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import { WEI_PER_TOKEN } from 'src/web3/consts'
import { getContractKit } from 'src/web3/contracts'
import config from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { buildTxo } from 'src/web3/utils'

const TAG = 'SuperchargeRewardsClaimer'
const SUPERCHARGE_FETCH_TIMEOUT = 30_000

export function* claimRewardsSaga({ payload: rewards }: ReturnType<typeof claimRewards>) {
  try {
    const kit: ContractKit = yield call(getContractKit)
    const walletAddress: string = yield call(getConnectedUnlockedAccount)
    const baseNonce: number = yield call(
      // @ts-ignore I can't figure out the syntax for this, it works but TS complains :'(
      [kit.web3.eth, kit.web3.eth.getTransactionCount],
      walletAddress
    )

    Logger.debug(TAG, `Starting to claim ${rewards.length} rewards with baseNonce: ${baseNonce}`)

    const receivedRewards: {
      amount: string
      tokenAddress: string
      txHash: string
    }[] = yield all(rewards.map((reward, index) => call(claimReward, reward, index, baseNonce)))

    const superchargeRewardContractAddress = yield select(superchargeRewardContractAddressSelector)
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
          address: superchargeRewardContractAddress,
          hash: reward.txHash,
        })
      )
    }
    yield put(setAvailableRewards([]))
    yield put(fetchAvailableRewards())
    yield put(claimRewardsSuccess())
    yield put(showMessage(i18n.t('superchargeClaimSuccess')))
    navigateHome()
  } catch (error) {
    yield put(claimRewardsFailure())
    yield put(showError(ErrorMessages.SUPERCHARGE_CLAIM_FAILED))
    Logger.error(TAG, 'Error claiming rewards', error as Error)
  }
}

function* claimReward(reward: SuperchargePendingReward, index: number, baseNonce: number) {
  const { transaction, details } = reward

  const superchargeRewardContractAddress = yield select(superchargeRewardContractAddressSelector)
  if (superchargeRewardContractAddress !== transaction.to) {
    Logger.error(
      TAG,
      `Unexpected supercharge contract address ${transaction.to} on reward transaction, aborting claim.`
    )
    return
  }

  const kit: ContractKit = yield call(getContractKit)
  const tokens: TokenBalances = yield select(tokensByAddressSelector)
  const walletAddress: string = yield call(getConnectedUnlockedAccount)

  Logger.debug(TAG, `Start claiming reward at index ${index}: ${JSON.stringify(reward)}`)

  const normalizer = new TxParamsNormalizer(kit.connection)
  const tx: CeloTx = yield call([normalizer, 'populate'], transaction)
  const txo = buildTxo(kit, tx)

  const receipt: CeloTxReceipt = yield call(
    sendTransaction,
    txo,
    walletAddress,
    newTransactionContext(TAG, 'Claim Supercharge reward'),
    undefined,
    undefined,
    undefined,
    baseNonce + index
  )
  Logger.info(TAG, `Claimed reward at index ${index}: ${JSON.stringify(receipt)}`)
  const amount = new BigNumber(details.amount, 16).div(WEI_PER_TOKEN).toString()
  const tokenAddress = details.tokenAddress.toLowerCase()
  ValoraAnalytics.track(RewardsEvents.claimed_reward, {
    amount,
    token: tokens[tokenAddress]?.symbol ?? '',
  })
  return {
    tokenAddress,
    amount,
    txHash: receipt.transactionHash,
  }
}

export function* fetchAvailableRewardsSaga() {
  const address: string | null = yield select(walletAddressSelector)
  if (!address) {
    Logger.debug(TAG, 'Skipping fetching available rewards since no address was found')
    return
  }
  try {
    const response: Response = yield call(
      fetchWithTimeout,
      `${config.fetchAvailableSuperchargeRewards}?userAddress=${address}`,
      SUPERCHARGE_FETCH_TIMEOUT
    )
    const data: { rewards: SuperchargePendingReward[] } = yield call([response, 'json'])
    yield put(setAvailableRewards(data.rewards))
    yield put(fetchAvailableRewardsSuccess())
  } catch (e) {
    yield put(fetchAvailableRewardsFailure())
    yield put(showError(ErrorMessages.SUPERCHARGE_FETCH_REWARDS_FAILED))
    Logger.error(TAG, 'Error fetching supercharge rewards', e as Error)
  }
}

export function* watchAvailableRewards() {
  yield takeEvery(fetchAvailableRewards.type, fetchAvailableRewardsSaga)
}

export function* watchClaimRewards() {
  yield takeEvery(claimRewards.type, claimRewardsSaga)
}

export function* superchargeSaga() {
  yield spawn(watchClaimRewards)
  yield spawn(watchAvailableRewards)
}
