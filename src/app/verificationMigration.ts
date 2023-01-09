import { ContractKit } from '@celo/contractkit'
import { AttestationStat, AttestationsWrapper } from '@celo/contractkit/lib/wrappers/Attestations'
import getPhoneHash from '@celo/phone-utils/lib/getPhoneHash'
import { isAccountConsideredVerified } from '@celo/utils/lib/attestations'
import { call, select } from 'redux-saga-test-plan/matchers'
import { e164NumberSelector } from 'src/account/selectors'
import { E164NumberToSaltType } from 'src/identity/reducer'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'

const TAG = 'verificationMigration'

function* fetchPhoneIdentifier() {
  const e164Number: string = yield select(e164NumberSelector)
  const e164NumberToSalt: E164NumberToSaltType = yield select(e164NumberToSaltSelector)
  const pepper = e164NumberToSalt[e164Number]
  if (!e164Number || !pepper) {
    Logger.debug(
      TAG,
      `No number or pepper found - Number present? ${!!e164Number} - Pepper present? ${!!pepper}`
    )
    return null
  }
  return getPhoneHash(e164Number, pepper)
}

function* isAddressVerified(address: string | null) {
  if (!address) {
    return false
  }

  const identifier: string | null = yield call(fetchPhoneIdentifier)
  if (!identifier) {
    return false
  }

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
