import { ContractKit } from '@celo/contractkit'
import { AttestationStat, AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import { isAccountConsideredVerified } from '@celo/utils/lib/attestations'
import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import { call, put, select } from 'redux-saga-test-plan/matchers'
import { verificationMigrationRan } from 'src/app/actions'
import { numberVerifiedSelector, ranVerificationMigrationSelector } from 'src/app/selectors'
import { E164NumberToSaltType } from 'src/identity/reducer'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import Logger from 'src/utils/Logger'
import { e164NumberSelector, KomenciContext, komenciContextSelector } from 'src/verify/reducer'
import { getContractKit } from 'src/web3/contracts'
import { mtwAddressSelector } from 'src/web3/selectors'

const TAG = 'verificationMigration'

function* isAddressVerified(address: string | null) {
  if (!address) {
    return false
  }
  const e164Number: string = yield select(e164NumberSelector)
  const e164NumberToSalt: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const pepper = e164NumberToSalt[e164Number]
  if (!e164Number || !pepper) {
    Logger.debug(
      TAG,
      `No number or pepper found - Number present? ${!!e164Number} - Pepper present? ${!!pepper}`
    )
    return false
  }
  const identifier = getPhoneHash(e164Number, pepper)

  const kit: ContractKit = yield call(getContractKit)
  const attestations: AttestationsWrapper = yield call([
    kit.contracts,
    kit.contracts.getAttestations,
  ])
  const attestationStats: AttestationStat = yield call(
    [attestations, attestations.getAttestationStat],
    identifier,
    address
  )

  const { isVerified } = isAccountConsideredVerified(attestationStats)
  return isVerified
}

// This migration fixes two errors introduced by the 1.13 release:
// - mtwAddress not set in redux store
// - non-verified users marked as verified
export function* runVerificationMigration() {
  const ranVerificationMigration: boolean = yield select(ranVerificationMigrationSelector)
  if (ranVerificationMigration) {
    return
  }
  Logger.debug(TAG, 'Starting to run verification migration for 1.13 errors')
  const numberVerified: boolean = yield select(numberVerifiedSelector)
  const mtwAddress: string | null = yield select(mtwAddressSelector)
  const komenci: KomenciContext = yield select(komenciContextSelector)
  const address = mtwAddress ?? komenci.unverifiedMtwAddress
  Logger.debug(
    TAG,
    `mtwAddress: ${mtwAddress}, unverifiedMtwAddress: ${komenci.unverifiedMtwAddress}, numberVerified: ${numberVerified}`
  )

  if (address) {
    const isVerified: boolean = yield call(isAddressVerified, address)
    Logger.debug(TAG, `address ${address} is verified: ${isVerified}`)
    yield put(verificationMigrationRan(isVerified ? address : null, isVerified))
  } else {
    // Likely older install before the MTW was introduced, or unverified account
    Logger.debug(
      TAG,
      `mtw address not present, leaving previous verification status: ${numberVerified}`
    )
    yield put(verificationMigrationRan(null, numberVerified))
  }
}
