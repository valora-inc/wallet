import { TxParamsNormalizer } from '@celo/connect/lib/utils/tx-params-normalizer'
import BigNumber from 'bignumber.js'
import { showError, showMessage } from 'src/alert/actions'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector, rewardsEnabledSelector } from 'src/app/selectors'
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
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { tokensByAddressSelector, tokensWithTokenBalanceSelector } from 'src/tokens/selectors'
import { getTokenId } from 'src/tokens/utils'
import { addStandbyTransaction } from 'src/transactions/actions'
import { sendTransaction } from 'src/transactions/send'
import { TokenTransactionTypeV2, newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import { safely } from 'src/utils/safely'
import { WEI_PER_TOKEN } from 'src/web3/consts'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { buildTxo } from 'src/web3/utils'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'

const TAG = 'SuperchargeRewardsClaimer'
export const SUPERCHARGE_FETCH_TIMEOUT = 45_000

export function* claimRewardsSaga({ payload: rewards }: ReturnType<typeof claimRewards>) {
  try {
    const kit = yield* call(getContractKit)
    const walletAddress = yield* call(getConnectedUnlockedAccount)
    const baseNonce = yield* call(
      // @ts-ignore I can't figure out the syntax for this, it works but TS complains :'(
      [kit.web3.eth, kit.web3.eth.getTransactionCount],
      walletAddress
    )

    Logger.debug(TAG, `Starting to claim ${rewards.length} rewards with baseNonce: ${baseNonce}`)

    let receivedRewards: {
      fundsSource: string
      amount: string
      tokenAddress: string
      txHash: string
    }[] = []

    if (rewards.length > 0) {
      receivedRewards = (yield* all(
        rewards.map((reward, index) => call(claimReward, reward, index, baseNonce))
      )) as {
        fundsSource: string
        amount: string
        tokenAddress: string
        txHash: string
      }[]
    }

    for (const reward of receivedRewards) {
      yield* put(
        addStandbyTransaction({
          __typename: 'TokenTransferV3',
          type: TokenTransactionTypeV2.Received,
          context: newTransactionContext('Claim Reward', reward.txHash),
          networkId: networkConfig.defaultNetworkId,
          amount: {
            value: reward.amount,
            tokenAddress: reward.tokenAddress,
            tokenId: getTokenId(networkConfig.defaultNetworkId, reward.tokenAddress),
          },
          address: reward.fundsSource,
          transactionHash: reward.txHash,
          metadata: {},
        })
      )
    }
    yield* put(setAvailableRewards([]))
    yield* put(fetchAvailableRewards({ forceRefresh: true }))
    yield* put(claimRewardsSuccess())
    yield* put(showMessage(i18n.t('superchargeClaimSuccess')))
    vibrateSuccess()
    navigateHome()
  } catch (error) {
    yield* put(claimRewardsFailure())
    yield* put(showError(ErrorMessages.SUPERCHARGE_CLAIM_FAILED))
    Logger.error(TAG, 'Error claiming rewards', error as Error)
  }
}

function* claimReward(reward: SuperchargePendingReward, index: number, baseNonce: number) {
  const { transaction, details } = reward

  const superchargeRewardContractAddress = yield* select(superchargeRewardContractAddressSelector)
  if (superchargeRewardContractAddress !== transaction.to) {
    throw new Error(
      `Unexpected supercharge contract address ${transaction.to} on reward transaction, aborting claim.`
    )
  }

  const kit = yield* call(getContractKit)
  const tokens = yield* select(tokensByAddressSelector)
  const walletAddress = yield* call(getConnectedUnlockedAccount)

  Logger.debug(TAG, `Start claiming reward at index ${index}:`, reward)

  const normalizer = new TxParamsNormalizer(kit.connection)
  const tx = yield* call([normalizer, 'populate'], transaction)
  const txo = buildTxo(kit, tx)

  const receipt = yield* call(
    sendTransaction,
    txo,
    walletAddress,
    newTransactionContext(TAG, 'Claim Supercharge reward'),
    transaction.gas,
    undefined,
    undefined,
    baseNonce + index
  )
  Logger.info(TAG, `Claimed reward at index ${index}:`, receipt)
  const amount = new BigNumber(details.amount).div(WEI_PER_TOKEN).toString()
  const tokenAddress = details.tokenAddress.toLowerCase()
  ValoraAnalytics.track(RewardsEvents.claimed_reward, {
    amount,
    token: tokens[tokenAddress]?.symbol ?? '',
    version: 2,
  })
  return {
    fundsSource: superchargeRewardContractAddress,
    tokenAddress,
    amount,
    txHash: receipt.transactionHash,
  }
}

export function* fetchAvailableRewardsSaga({ payload }: ReturnType<typeof fetchAvailableRewards>) {
  const rewardsEnabled = yield* select(rewardsEnabledSelector)
  if (!rewardsEnabled) {
    yield* put(fetchAvailableRewardsSuccess())
    Logger.debug(TAG, 'Skipping fetching available rewards since rewards are not enabled')
    return
  }

  const address = yield* select(walletAddressSelector)
  if (!address) {
    yield* put(fetchAvailableRewardsSuccess())
    Logger.debug(TAG, 'Skipping fetching available rewards since no address was found')
    return
  }

  const supportedNetworkIds = [networkConfig.defaultNetworkId] // rewards are only availabe on Celo
  const tokensWithTokenBalance = yield* select(tokensWithTokenBalanceSelector, supportedNetworkIds)
  if (tokensWithTokenBalance.length === 0) {
    yield* put(fetchAvailableRewardsSuccess())
    Logger.debug(
      TAG,
      'Skipping fetching available rewards due to lack of tokens with sufficient balance'
    )
    return
  }

  const numberVerifiedCentrally = yield* select(phoneNumberVerifiedSelector)
  if (!numberVerifiedCentrally) {
    yield* put(fetchAvailableRewardsSuccess())
    Logger.debug(TAG, 'Skipping fetching available rewards since user is not verified with CPV')
    return
  }

  try {
    const superchargeRewardsUrl = networkConfig.fetchAvailableSuperchargeRewards

    const response = yield* call(
      fetchWithTimeout,
      `${superchargeRewardsUrl}?address=${address}`,
      payload?.forceRefresh
        ? {
            headers: {
              'Cache-Control': 'max-age=0',
            },
          }
        : null,
      SUPERCHARGE_FETCH_TIMEOUT
    )
    const data: { availableRewards: SuperchargePendingReward[] } = yield* call([response, 'json'])
    if (!data.availableRewards) {
      throw new Error(
        `No rewards field found in supercharge service response ${JSON.stringify(data)}`
      )
    }

    yield* put(setAvailableRewards(data.availableRewards))
    yield* put(fetchAvailableRewardsSuccess())
  } catch (e) {
    yield* put(fetchAvailableRewardsFailure())
    Logger.error(TAG, 'Error fetching supercharge rewards', e as Error)
  }
}

export function* watchAvailableRewards() {
  yield* takeLatest(fetchAvailableRewards.type, safely(fetchAvailableRewardsSaga))
}

export function* watchClaimRewards() {
  yield* takeEvery(claimRewards.type, safely(claimRewardsSaga))
}

export function* superchargeSaga() {
  yield* spawn(watchClaimRewards)
  yield* spawn(watchAvailableRewards)
}
