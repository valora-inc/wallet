import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { Share } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { generateSecureRandom } from 'react-native-securerandom'
import { call, put } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { APP_STORE_ID, DYNAMIC_DOWNLOAD_LINK, WEB_LINK } from 'src/config'
import { transferEscrowedPayment } from 'src/escrow/actions'
import { getEscrowTxGas } from 'src/escrow/saga'
import { calculateFee, FeeInfo } from 'src/fees/saga'
import { generateShortInviteLink } from 'src/firebase/dynamicLinks'
import i18n from 'src/i18n'
import { fetchPhoneHashPrivate } from 'src/identity/privateHashing'
import { InviteDetails, storeInviteeData } from 'src/invite/actions'
import { createInviteCode } from 'src/invite/utils'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { newTransactionContext } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getWeb3 } from 'src/web3/contracts'
import Web3 from 'web3'

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
    const feeInfo = await calculateFee(gas, currency)
    return feeInfo
  } catch (error) {
    throw error
  }
}

export async function generateInviteLink() {
  let bundleId = DeviceInfo.getBundleId()
  bundleId = bundleId.replace(/\.(debug|dev)$/g, '.alfajores')

  const shortUrl = await generateShortInviteLink({
    link: WEB_LINK,
    appStoreId: APP_STORE_ID,
    bundleId,
  })

  return shortUrl
}

export function* sendInvite(
  e164Number: string,
  amount: BigNumber,
  currency: Currency,
  feeInfo?: FeeInfo
) {
  try {
    ValoraAnalytics.track(InviteEvents.invite_start, {
      escrowIncluded: true,
      amount: amount?.toString(),
    })

    const web3: Web3 = yield call(getWeb3)
    const randomness: Uint8Array = yield call(generateSecureRandom, 64)
    const temporaryWalletAccount = web3.eth.accounts.create(
      Buffer.from(randomness).toString('ascii')
    )
    const temporaryAddress = temporaryWalletAccount.address
    const inviteCode = createInviteCode(temporaryWalletAccount.privateKey)

    const link = DYNAMIC_DOWNLOAD_LINK

    const messageProp = amount
      ? 'sendFlow7:inviteWithEscrowedPayment'
      : 'sendFlow7:inviteWithoutPayment'
    const message = i18n.t(messageProp, {
      amount: amount?.toString(),
      link,
    })

    const inviteDetails: InviteDetails = {
      timestamp: Date.now(),
      e164Number,
      tempWalletAddress: temporaryAddress.toLowerCase(),
      tempWalletPrivateKey: temporaryWalletAccount.privateKey,
      tempWalletRedeemed: false, // no logic in place to toggle this yet
      inviteCode,
      inviteLink: link,
    }

    // Store the Temp Address locally so we know which transactions were invites
    yield put(storeInviteeData(inviteDetails))

    yield call(initiateEscrowTransfer, e164Number, amount, currency, undefined, feeInfo)
    yield call(Share.share, { message })
  } catch (e) {
    ValoraAnalytics.track(InviteEvents.invite_error, {
      escrowIncluded: true,
      error: e.message,
      amount: amount?.toString(),
    })
    Logger.error(TAG, 'Send invite error: ', e)
    throw e
  }
}

export function* initiateEscrowTransfer(
  e164Number: string,
  amount: BigNumber,
  currency: Currency,
  temporaryAddress?: string,
  feeInfo?: FeeInfo
) {
  const context = newTransactionContext(TAG, 'Escrow funds')
  try {
    const phoneHashDetails: PhoneNumberHashDetails = yield call(fetchPhoneHashPrivate, e164Number)
    yield put(
      transferEscrowedPayment(
        phoneHashDetails,
        amount,
        currency,
        context,
        temporaryAddress,
        feeInfo
      )
    )
    yield call(waitForTransactionWithId, context.id)
    Logger.debug(TAG + '@sendInviteSaga', 'Escrowed money to new wallet')
  } catch (e) {
    Logger.error(TAG, 'Error sending payment to unverified user: ', e)
    yield put(showError(ErrorMessages.ESCROW_TRANSFER_FAILED))
  }
}
