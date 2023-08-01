import { OdisUtils } from '@celo/identity'
import { IdentifierHashDetails, IdentifierPrefix } from '@celo/identity/lib/odis/identifier'
import { PhoneNumberHashDetails } from '@celo/identity/lib/odis/phone-number-identifier'
import { AuthSigner, ServiceContext } from '@celo/identity/lib/odis/query'
import { CombinerEndpointPNP } from '@celo/phone-number-privacy-common'
import { PhoneNumberUtils, isE164NumberStrict } from '@celo/phone-utils'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import DeviceInfo from 'react-native-device-info'
import { e164NumberSelector } from 'src/account/selectors'
import { IdentityEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { updateE164PhoneNumberSalts } from 'src/identity/actions'
import { ReactBlsBlindingClient } from 'src/identity/bls-blinding-client'
import { E164NumberToSaltType } from 'src/identity/reducer'
import {
  e164NumberToSaltSelector,
  isBalanceSufficientForSigRetrievalSelector,
} from 'src/identity/selectors'
import { isUserBalanceSufficient } from 'src/identity/utils'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { transferStableTokenLegacy } from 'src/stableToken/actions'
import { CurrencyTokens, tokensByCurrencySelector } from 'src/tokens/selectors'
import { waitForTransactionWithId } from 'src/transactions/saga'
import { newTransactionContext } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'
import { ensureError } from 'src/utils/ensureError'
import { getAuthSignerForAccount } from 'src/web3/dataEncryptionKey'
import networkConfig from 'src/web3/networkConfig'
import { UnlockResult, getAccount, getAccountAddress, unlockAccount } from 'src/web3/saga'
import { currentAccountSelector, dataEncryptionKeySelector } from 'src/web3/selectors'
import { call, put, select } from 'typed-redux-saga'

const TAG = 'identity/privateHashing'
export const LOOKUP_GAS_FEE_ESTIMATE = 0.03

// Fetch and cache a phone number's salt and hash
export function* fetchPhoneHashPrivate(e164Number: string) {
  try {
    const details: PhoneNumberHashDetails = yield* call(doFetchPhoneHashPrivate, e164Number)
    return details
  } catch (err) {
    const error = ensureError(err)
    if (error.message === ErrorMessages.SALT_QUOTA_EXCEEDED) {
      Logger.warn(`${TAG}@fetchPhoneHashPrivate`, 'Salt quota exceeded')

      const isBalanceSufficientForQuota = yield* select(isBalanceSufficientForSigRetrievalSelector)
      if (!isBalanceSufficientForQuota) {
        Logger.debug(`${TAG}@fetchPhoneHashPrivate`, 'ODIS insufficient balance', error)
        throw new Error(ErrorMessages.ODIS_INSUFFICIENT_BALANCE)
      }

      const quotaPurchaseSuccess: boolean = yield* call(navigateToQuotaPurchaseScreen)
      if (quotaPurchaseSuccess) {
        // If quota purchase was successful, try lookup a second time
        const details: PhoneNumberHashDetails = yield* call(doFetchPhoneHashPrivate, e164Number)
        return details
      } else {
        throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
      }
    } else {
      Logger.error(`${TAG}@fetchPhoneHashPrivate`, 'Failed to fetch phone hash private', error)
      throw new Error(ErrorMessages.SALT_FETCH_FAILURE)
    }
  }
}

/**
 * Retrieve the salt from the cache if present,
 * otherwise query from the service
 */
function* doFetchPhoneHashPrivate(e164Number: string) {
  Logger.debug(`${TAG}@doFetchPhoneHashPrivate`, 'Fetching phone hash details')
  const saltCache: E164NumberToSaltType = yield* select(e164NumberToSaltSelector)
  const cachedSalt = saltCache[e164Number]

  if (cachedSalt) {
    Logger.debug(`${TAG}@doFetchPhoneHashPrivate`, 'Salt was cached')
    const phoneHash = getPhoneHash(e164Number, cachedSalt)
    const cachedDetails: PhoneNumberHashDetails = { e164Number, phoneHash, pepper: cachedSalt }
    return cachedDetails
  }

  const details: PhoneNumberHashDetails = yield* call(getPhoneHashPrivate, e164Number)
  yield* put(updateE164PhoneNumberSalts({ [e164Number]: details.pepper }))
  return details
}

// Unlike the getPhoneHash in utils, this leverages the phone number
// privacy service to compute a secure, unique salt for the phone number
// and then appends it before hashing.
function* getPhoneHashPrivate(e164Number: string) {
  if (!isE164NumberStrict(e164Number)) {
    throw new Error(ErrorMessages.INVALID_PHONE_NUMBER)
  }

  const walletAddress: string = yield* call(getAccount)
  const accountAddress: string = yield* call(getAccountAddress)
  const authSigner: AuthSigner = yield* call(getAuthSignerForAccount, accountAddress, walletAddress)

  // Unlock the account if the authentication is signed by the wallet
  if (authSigner.authenticationMethod === OdisUtils.Query.AuthenticationMethod.WALLET_KEY) {
    const result: UnlockResult = yield* call(unlockAccount, walletAddress)
    if (result !== UnlockResult.SUCCESS) {
      throw new Error(ErrorMessages.INCORRECT_PIN)
    }
  }

  const { odisPubKey, odisUrl } = networkConfig
  const serviceContext: ServiceContext = {
    odisUrl,
    odisPubKey,
  }
  // Use DEK for deterministic randomness
  // This allows user to use the same blinded message for the same phone number
  // which prevents consumption of quota for future duplicate requests
  const privateDataKey: string | null = yield* select(dataEncryptionKeySelector)
  if (!privateDataKey) {
    throw new Error('No data key in store. Should never happen.')
  }

  const blindingFactor = ReactBlsBlindingClient.generateDeterministicBlindingFactor(
    privateDataKey,
    e164Number
  )

  Logger.debug(TAG, '@fetchPrivatePhoneHash', 'Blinding factor', blindingFactor)
  const blsBlindingClient = new ReactBlsBlindingClient(networkConfig.odisPubKey, blindingFactor)
  try {
    const identifierHashDetails = (yield* call(
      // @ts-expect-error suspect that something about how this is exported messes up the type
      OdisUtils.Identifier.getObfuscatedIdentifier,
      e164Number,
      IdentifierPrefix.PHONE_NUMBER,
      accountAddress,
      authSigner,
      serviceContext,
      blindingFactor,
      DeviceInfo.getVersion(),
      blsBlindingClient,
      undefined,
      undefined,
      CombinerEndpointPNP.LEGACY_PNP_SIGN
    )) as IdentifierHashDetails
    const phoneNumberHashDetails: PhoneNumberHashDetails = {
      e164Number: identifierHashDetails.plaintextIdentifier,
      phoneHash: identifierHashDetails.obfuscatedIdentifier,
      pepper: identifierHashDetails.pepper,
      unblindedSignature: identifierHashDetails.unblindedSignature,
    }
    return phoneNumberHashDetails
  } catch (err) {
    const error = ensureError(err)
    if (error.message === ErrorMessages.ODIS_QUOTA_ERROR) {
      throw new Error(ErrorMessages.SALT_QUOTA_EXCEEDED)
    }
    throw error
  }
}

// Get the wallet user's own phone hash details if they're cached
// null otherwise
export function* getUserSelfPhoneHashDetails() {
  const e164Number = yield* select(e164NumberSelector)
  if (!e164Number) {
    return undefined
  }

  const saltCache: E164NumberToSaltType = yield* select(e164NumberToSaltSelector)
  const salt = saltCache[e164Number]

  if (!salt) {
    return undefined
  }

  const details: PhoneNumberHashDetails = {
    e164Number,
    pepper: salt,
    phoneHash: PhoneNumberUtils.getPhoneHash(e164Number, salt),
  }

  return details
}

function doNavigate() {
  return new Promise((resolve, reject) => {
    navigate(Screens.PhoneNumberLookupQuota, {
      onBuy: resolve as () => void,
      onSkip: () => reject('skipped'),
    })
  })
}
function* navigateToQuotaPurchaseScreen() {
  try {
    yield* call(doNavigate)

    const ownAddress = yield* select(currentAccountSelector)
    if (!ownAddress) {
      throw new Error('No account set')
    }
    const tokens: CurrencyTokens = yield* select(tokensByCurrencySelector)
    const userBalance = tokens[Currency.Dollar]?.balance.toString() ?? null
    const userBalanceSufficient = isUserBalanceSufficient(userBalance, LOOKUP_GAS_FEE_ESTIMATE)
    if (!userBalanceSufficient) {
      throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
    }

    const context = newTransactionContext(TAG, 'Purchase lookup quota')
    yield* put(
      transferStableTokenLegacy({
        recipientAddress: ownAddress, // send payment to yourself
        amount: '0.01', // one penny
        currency: Currency.Dollar,
        comment: 'Lookup Quota Purchase',
        context,
      })
    )

    const quotaPurchaseTxSuccess = yield* call(waitForTransactionWithId, context.id)
    if (!quotaPurchaseTxSuccess) {
      throw new Error('Purchase tx failed')
    }

    ValoraAnalytics.track(IdentityEvents.phone_number_lookup_purchase_complete)
    Logger.debug(`${TAG}@navigateToQuotaPurchaseScreen`, `Quota purchase successful`)
    navigateBack()
    return true
  } catch (error) {
    if (error === 'skipped') {
      ValoraAnalytics.track(IdentityEvents.phone_number_lookup_purchase_skip)
    } else {
      ValoraAnalytics.track(IdentityEvents.phone_number_lookup_purchase_error, {
        error: ensureError(error).message,
      })
    }
    Logger.error(
      `${TAG}@navigateToQuotaPurchaseScreen`,
      `Quota purchase cancelled or skipped`,
      error
    )
    navigateBack()
    return false
  }
}
