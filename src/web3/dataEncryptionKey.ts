/**
 * Sagas and utils for handling DEK related tasks
 * Ideally all this code and the DEK state and logic would be moved out of the web3 dir
 * but keeping it here for now since that's where other account state is
 */

import { CeloTransactionObject } from '@celo/connect'
import { ContractKit } from '@celo/contractkit/lib/kit'
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts'
import { MetaTransactionWalletWrapper } from '@celo/contractkit/lib/wrappers/MetaTransactionWallet'
import { compressedPubKey, deriveDek } from '@celo/cryptographic-utils'
import { OdisUtils } from '@celo/identity'
import { AuthSigner } from '@celo/identity/lib/odis/query'
import {
  ensureLeading0x,
  eqAddress,
  hexToBuffer,
  normalizeAddressWith0x,
  privateKeyToAddress,
} from '@celo/utils/lib/address'
import { UnlockableWallet } from '@celo/wallet-base'
import { Platform } from 'react-native'
import * as bip39 from 'react-native-bip39'
import DeviceInfo from 'react-native-device-info'
import { call, put, select } from 'redux-saga/effects'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { features } from 'src/flags'
import {
  FetchDataEncryptionKeyAction,
  updateAddressDekMap,
  updateWalletToAccountAddress,
} from 'src/identity/actions'
import { WalletToAccountAddressType } from 'src/identity/reducer'
import { walletToAccountAddressSelector } from 'src/identity/selectors'
import { DEK, retrieveOrGeneratePepper, retrieveSignedMessage } from 'src/pincode/authentication'
import { getCurrencyAddress } from 'src/tokens/saga'
import { CurrencyTokens, tokensByCurrencySelector } from 'src/tokens/selectors'
import { sendTransaction } from 'src/transactions/send'
import { newTransactionContext } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { registerDataEncryptionKey, setDataEncryptionKey } from 'src/web3/actions'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getAccount, getAccountAddress, getConnectedUnlockedAccount } from 'src/web3/saga'
import {
  dataEncryptionKeySelector,
  isDekRegisteredSelector,
  mtwAddressSelector,
  walletAddressSelector,
} from 'src/web3/selectors'
import { estimateGas } from 'src/web3/utils'

const TAG = 'web3/dataEncryptionKey'
const PLACEHOLDER_DEK = '0x02c9cacca8c5c5ebb24dc6080a933f6d52a072136a069083438293d71da36049dc'

export function* fetchDataEncryptionKeyWrapper({ address }: FetchDataEncryptionKeyAction) {
  yield call(doFetchDataEncryptionKey, address)
}

export function* fetchDEKDecentrally(walletAddress: string) {
  // TODO consider caching here
  // We could use the values in the DekMap instead of looking up each time
  // But Deks can change, how should we invalidate the cache?

  const contractKit = yield call(getContractKit)
  const accountsWrapper: AccountsWrapper = yield call([
    contractKit.contracts,
    contractKit.contracts.getAccounts,
  ])
  const walletToAccountAddress: WalletToAccountAddressType = yield select(
    walletToAccountAddressSelector
  )
  const accountAddress =
    walletToAccountAddress[normalizeAddressWith0x(walletAddress)] ?? walletAddress
  const dek: string = yield call(accountsWrapper.getDataEncryptionKey, accountAddress)
  yield put(updateAddressDekMap(accountAddress, dek || null))
  return !dek ? null : hexToBuffer(dek)
}

export function* doFetchDataEncryptionKey(walletAddress: string) {
  const address = yield select(walletAddressSelector)
  const privateDataEncryptionKey = yield select(dataEncryptionKeySelector)
  if (walletAddress.toLowerCase() === address.toLowerCase() && privateDataEncryptionKey) {
    // we can generate the user's own public DEK without making any requests
    return compressedPubKey(hexToBuffer(privateDataEncryptionKey))
  }

  try {
    const signedMessage = yield call(retrieveSignedMessage)
    const queryParams = new URLSearchParams({
      address,
      clientPlatform: Platform.OS,
      clientVersion: DeviceInfo.getVersion(),
    }).toString()

    const response = yield call(fetch, `${networkConfig.getPublicDEKUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Valora ${address}:${signedMessage}`,
      },
    })

    if (response.ok) {
      const { data }: { data: { publicDataEncryptionKey: string } } = yield call([response, 'json'])
      return data.publicDataEncryptionKey
    } else {
      throw new Error(yield call([response, 'text']))
    }
  } catch (error) {
    Logger.debug(
      `${TAG}/doFetchDataEncryptionKey`,
      `Failed to get DEK for address ${walletAddress}`,
      error
    )
  }

  // fall back to decentralised fetch if the above fails to maintain backwards compatibility
  return yield call(fetchDEKDecentrally, walletAddress)
}

export function* createAccountDek(mnemonic: string) {
  if (!mnemonic) {
    throw new Error('Cannot generate DEK with empty mnemonic')
  }
  const { privateKey } = yield call(deriveDek, mnemonic, bip39)
  const newDek = ensureLeading0x(privateKey)
  yield put(setDataEncryptionKey(newDek))
  return newDek
}

function* sendUserFundedSetAccountTx(
  contractKit: ContractKit,
  accountsWrapper: AccountsWrapper,
  publicDataKey: string,
  accountAddress: string,
  walletAddress: string
) {
  const mtwAddressCreated: boolean = !!(yield select(mtwAddressSelector))
  // Generate and send a transaction to set the DEK on-chain.
  let setAccountTx = accountsWrapper.setAccount('', publicDataKey, walletAddress)
  const context = newTransactionContext(TAG, 'Set wallet address & DEK')
  // If MTW has been created, route the user's DEK/wallet registration through it
  // because accountAddress is determined by msg.sender. Else, do it normally
  if (mtwAddressCreated) {
    const mtwWrapper: MetaTransactionWalletWrapper = yield call(
      [contractKit.contracts, contractKit.contracts.getMetaTransactionWallet],
      accountAddress
    )

    const proofOfPossession: {
      v: number
      r: string
      s: string
    } = yield call(
      [accountsWrapper, accountsWrapper.generateProofOfKeyPossession],
      accountAddress,
      walletAddress
    )

    setAccountTx = accountsWrapper.setAccount('', publicDataKey, walletAddress, proofOfPossession)

    const setAccountTxViaMTW: CeloTransactionObject<string> = yield call(
      [mtwWrapper, mtwWrapper.signAndExecuteMetaTransaction],
      setAccountTx.txo
    )
    yield call(sendTransaction, setAccountTxViaMTW.txo, walletAddress, context)
  } else {
    yield call(sendTransaction, setAccountTx.txo, walletAddress, context)
  }
  yield put(updateWalletToAccountAddress({ [walletAddress]: accountAddress }))
}

// Register the address and DEK with the Accounts contract
// A no-op if registration has already been done
// pendingMtwAddress is only passed during feeless verification flow
export function* registerAccountDek() {
  try {
    const isAlreadyRegistered = yield select(isDekRegisteredSelector)
    if (isAlreadyRegistered) {
      Logger.debug(
        `${TAG}@registerAccountDek`,
        'Skipping DEK registration because its already registered'
      )
      return
    }
    const tokens: CurrencyTokens = yield select(tokensByCurrencySelector)
    const cusdBalance = tokens[Currency.Dollar]?.balance
    const celoBalance = tokens[Currency.Celo]?.balance
    if (!cusdBalance && !celoBalance) {
      Logger.debug(
        `${TAG}@registerAccountDek`,
        'Skipping DEK registration because there are no funds'
      )
      return
    }

    ValoraAnalytics.track(OnboardingEvents.account_dek_register_start)
    Logger.debug(
      `${TAG}@registerAccountDek`,
      'Setting wallet address and public data encryption key'
    )

    const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
    if (!privateDataKey) {
      throw new Error('No data key in store. Should never happen.')
    }

    const publicDataKey = compressedPubKey(hexToBuffer(privateDataKey))

    const contractKit = yield call(getContractKit)
    const accountsWrapper: AccountsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAccounts,
    ])

    const accountAddress: string = yield call(getAccountAddress)
    const walletAddress: string = yield call(getAccount)

    const upToDate: boolean = yield call(
      isAccountUpToDate,
      accountsWrapper,
      accountAddress,
      walletAddress,
      publicDataKey
    )
    ValoraAnalytics.track(OnboardingEvents.account_dek_register_account_checked)

    if (upToDate) {
      Logger.debug(`${TAG}@registerAccountDek`, 'Address and DEK up to date, skipping.')
      yield put(registerDataEncryptionKey())
      ValoraAnalytics.track(OnboardingEvents.account_dek_register_complete, {
        newRegistration: false,
      })
      return
    }

    yield call(getConnectedUnlockedAccount)
    ValoraAnalytics.track(OnboardingEvents.account_dek_register_account_unlocked)

    yield call(
      sendUserFundedSetAccountTx,
      contractKit,
      accountsWrapper,
      publicDataKey,
      accountAddress,
      walletAddress
    )

    // TODO: Make sure this action is also triggered after the DEK registration
    // that will happen via Komenci
    yield put(registerDataEncryptionKey())
    ValoraAnalytics.track(OnboardingEvents.account_dek_register_complete, {
      newRegistration: true,
    })
  } catch (error) {
    // DEK registration failures are not considered fatal. Swallow the error and allow calling saga to proceed.
    // Registration will be re-attempted on next payment send
    Logger.error(`${TAG}@registerAccountDek`, 'Failure registering DEK', error)
  }
}

// Check if account address and DEK match what's in
// the Accounts contract
export async function isAccountUpToDate(
  accountsWrapper: AccountsWrapper,
  accountAddress: string,
  walletAddress: string,
  dataKey: string
) {
  if (!accountAddress || !dataKey) {
    return false
  }

  const [onchainWalletAddress, onchainDEK] = await Promise.all([
    accountsWrapper.getWalletAddress(accountAddress),
    accountsWrapper.getDataEncryptionKey(accountAddress),
  ])
  Logger.debug(`${TAG}/isAccountUpToDate`, `DEK associated with account ${onchainDEK}`)
  return (
    onchainWalletAddress &&
    onchainDEK &&
    eqAddress(onchainWalletAddress, walletAddress) &&
    eqAddress(onchainDEK, dataKey)
  )
}

export async function getRegisterDekTxGas(account: string, currency: Currency) {
  try {
    Logger.debug(`${TAG}/getRegisterDekTxGas`, 'Getting gas estimate for tx')
    const contractKit = await getContractKitAsync()
    const Accounts = await contractKit.contracts.getAccounts()
    const tx = Accounts.setAccount('', PLACEHOLDER_DEK, account)
    const txParams = { from: account, feeCurrency: await getCurrencyAddress(currency) }
    const gas = await estimateGas(tx.txo, txParams)
    Logger.debug(`${TAG}/getRegisterDekTxGas`, `Estimated gas of ${gas.toString()}`)
    return gas
  } catch (error) {
    Logger.warn(`${TAG}/getRegisterDekTxGas`, 'Failed to estimate DEK tx gas', error)
    throw Error(ErrorMessages.INSUFFICIENT_BALANCE)
  }
}

export function* getAuthSignerForAccount(accountAddress: string, walletAddress: string) {
  const contractKit = yield call(getContractKit)

  if (features.PNP_USE_DEK_FOR_AUTH) {
    // Use the DEK for authentication if the current DEK is registered with this account
    const accountsWrapper: AccountsWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getAccounts,
    ])
    const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
    if (!privateDataKey) {
      Logger.error(TAG + '/getAuthSignerForAccount', 'Missing comment key, should never happen.')
    } else {
      const publicDataKey = compressedPubKey(hexToBuffer(privateDataKey))
      const upToDate: boolean = yield call(
        isAccountUpToDate,
        accountsWrapper,
        accountAddress,
        walletAddress,
        publicDataKey
      )
      if (!upToDate) {
        Logger.error(TAG + '/getAuthSignerForAccount', `DEK mismatch.`)
      } else {
        Logger.info(TAG + '/getAuthSignerForAccount', 'Using DEK for authentication')
        const encyptionKeySigner: AuthSigner = {
          authenticationMethod: OdisUtils.Query.AuthenticationMethod.ENCRYPTION_KEY,
          rawKey: privateDataKey,
        }
        return encyptionKeySigner
      }
    }
  }

  // Fallback to using wallet key
  Logger.info(TAG + '/getAuthSignerForAccount', 'Using wallet key for authentication')
  const walletKeySigner: AuthSigner = {
    authenticationMethod: OdisUtils.Query.AuthenticationMethod.WALLET_KEY,
    contractKit,
  }
  return walletKeySigner
}

export function* importDekIfNecessary(wallet: UnlockableWallet | undefined) {
  const privateDataKey: string | null = yield select(dataEncryptionKeySelector)
  if (!privateDataKey) {
    throw new Error('No data key in store. Should never happen.')
  }
  const dataKeyAddress = normalizeAddressWith0x(
    privateKeyToAddress(ensureLeading0x(privateDataKey))
  )
  // directly using pepper because we don't want to set a PIN for the DEK
  const pepper: string = yield call(retrieveOrGeneratePepper, DEK)
  if (wallet && !wallet.hasAccount(dataKeyAddress)) {
    try {
      yield call([wallet, wallet.addAccount], privateDataKey, pepper)
    } catch (error) {
      Logger.warn('Unable to add DEK to wallet', error)
    }
  }
  return { dataKeyAddress, pepper }
}
