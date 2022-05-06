import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { Share } from 'react-native'
import { call, put, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { numberVerifiedSelector } from 'src/app/selectors'
import { DYNAMIC_DOWNLOAD_LINK } from 'src/config'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { getEscrowTxGas } from 'src/escrow/saga'
import { calculateFee, currencyToFeeCurrency, FeeInfo } from 'src/fees/saga'
import i18n from 'src/i18n'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { inviteRewardCusdSelector, inviteRewardsActiveSelector } from 'src/send/selectors'
import { TokenBalance } from 'src/tokens/reducer'
import { tokensListSelector } from 'src/tokens/selectors'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { newTransactionContext } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

const TAG = 'invite/saga'
export const REDEEM_INVITE_TIMEOUT = 1.5 * 60 * 1000 // 1.5 minutes
export const INVITE_FEE = '0.30'

export async function getInviteFee(
  account: string,
  currency: Currency,
  amount: string,
  balance: string,
  comment: string
): Promise<FeeInfo> {
  try {
    if (new BigNumber(amount).isGreaterThan(new BigNumber(balance))) {
      throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
    }
    const gas = await getEscrowTxGas()
    const feeInfo = await calculateFee(gas, await currencyToFeeCurrency(currency))
    return feeInfo
  } catch (error) {
    throw error
  }
}

export function* sendInvite(
  e164Number: string,
  amount: BigNumber,
  usdAmount: BigNumber | null,
  tokenAddress: string,
  feeInfo?: FeeInfo
) {
  try {
    ValoraAnalytics.track(InviteEvents.invite_start, {
      amount: amount.toString(),
      tokenAddress,
      usdAmount: usdAmount?.toString(),
    })

    const tokens: TokenBalance[] = yield select(tokensListSelector)
    const tokenInfo = tokens.find((token) => token.address === tokenAddress)
    if (!tokenInfo) {
      throw new Error(`Token with address ${tokenAddress} not found`)
    }

    const inviteRewardsEnabled = yield select(inviteRewardsActiveSelector)
    const numberVerified = yield select(numberVerifiedSelector)
    const rewardAmount = yield select(inviteRewardCusdSelector)
    const inviteRewardsActive = inviteRewardsEnabled && numberVerified

    const message = inviteRewardsActive
      ? i18n.t('inviteWithRewards', {
          amount: rewardAmount,
          token: Currency.Dollar,
          link: DYNAMIC_DOWNLOAD_LINK,
        })
      : i18n.t('inviteWithEscrowedPayment', {
          amount: amount.toFixed(2),
          token: tokenInfo.symbol,
          link: DYNAMIC_DOWNLOAD_LINK,
        })

    yield call(initiateEscrowTransfer, e164Number, amount, tokenAddress, feeInfo)
    yield call(Share.share, { message })
    ValoraAnalytics.track(InviteEvents.invite_complete, {
      amount: amount.toString(),
      tokenAddress,
      usdAmount: usdAmount?.toString(),
    })
  } catch (e) {
    ValoraAnalytics.track(InviteEvents.invite_error, {
      error: e.message,
      amount: amount.toString(),
      tokenAddress,
      usdAmount: usdAmount?.toString(),
    })
    Logger.error(TAG, 'Send invite error: ', e)
    throw e
  }
}

export function* initiateEscrowTransfer(
  e164Number: string,
  amount: BigNumber,
  tokenAddress: string,
  feeInfo?: FeeInfo
) {
  const context = newTransactionContext(TAG, 'Escrow funds')
  try {
    const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    yield put(transferEscrowedPayment(phoneHashDetails, amount, tokenAddress, context, feeInfo))
    yield call(waitForTransactionWithId, context.id)
    Logger.debug(TAG + '@sendInviteSaga', 'Escrowed money to new wallet')
  } catch (e) {
    Logger.error(TAG, 'Error sending payment to unverified user: ', e)
    yield put(showError(ErrorMessages.ESCROW_TRANSFER_FAILED))
  }
}
