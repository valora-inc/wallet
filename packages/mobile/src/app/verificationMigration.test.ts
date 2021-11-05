import { AttestationStat } from '@celo/contractkit/lib/wrappers/Attestations'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { verificationMigrationRan } from 'src/app/actions'
import { numberVerifiedSelector, ranVerificationMigrationSelector } from 'src/app/selectors'
import { runVerificationMigration } from 'src/app/verificationMigration'
import { e164NumberToSaltSelector } from 'src/identity/selectors'
import { e164NumberSelector, komenciContextSelector } from 'src/verify/reducer'
import { getContractKitAsync } from 'src/web3/contracts'
import { mtwAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockE164Number, mockE164NumberPepper } from 'test/values'

const now = Date.now()
Date.now = jest.fn(() => now)

describe('verificationMigration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  it("doesn't change anything if mtwAddress is present and verified", async () => {
    const kit = await getContractKitAsync()
    const stats: AttestationStat = {
      completed: 3,
      total: 3,
    }
    const mockAttestationsWrapper = {
      getAttestationStat: jest.fn(() => stats),
    }

    await expectSaga(runVerificationMigration)
      .provide([
        [select(ranVerificationMigrationSelector), false],
        [select(numberVerifiedSelector), true],
        [select(mtwAddressSelector), mockAccount],
        [select(komenciContextSelector), { unverifiedMtwAddress: mockAccount }],
        [select(e164NumberSelector), mockE164Number],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
        [call([kit.contracts, kit.contracts.getAttestations]), mockAttestationsWrapper],
      ])
      .put(verificationMigrationRan(mockAccount, true))
      .run()
  })

  it("doesn't change anything if mtwAddress is not present and not verified", async () => {
    const kit = await getContractKitAsync()
    const stats: AttestationStat = {
      completed: 2,
      total: 3,
    }
    const mockAttestationsWrapper = {
      getAttestationStat: jest.fn(() => stats),
    }

    await expectSaga(runVerificationMigration)
      .provide([
        [select(ranVerificationMigrationSelector), false],
        [select(numberVerifiedSelector), true],
        [select(mtwAddressSelector), null],
        [select(komenciContextSelector), { unverifiedMtwAddress: mockAccount }],
        [select(e164NumberSelector), mockE164Number],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
        [call([kit.contracts, kit.contracts.getAttestations]), mockAttestationsWrapper],
      ])
      .put(verificationMigrationRan(null, false))
      .run()
  })

  it("deletes the mtwAddress if it's present but not verified", async () => {
    const kit = await getContractKitAsync()
    const stats: AttestationStat = {
      completed: 2,
      total: 3,
    }
    const mockAttestationsWrapper = {
      getAttestationStat: jest.fn(() => stats),
    }

    await expectSaga(runVerificationMigration)
      .provide([
        [select(ranVerificationMigrationSelector), false],
        [select(numberVerifiedSelector), true],
        [select(mtwAddressSelector), mockAccount],
        [select(komenciContextSelector), { unverifiedMtwAddress: mockAccount }],
        [select(e164NumberSelector), mockE164Number],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
        [call([kit.contracts, kit.contracts.getAttestations]), mockAttestationsWrapper],
      ])
      .put(verificationMigrationRan(null, false))
      .run()
  })

  it("sets the mtwAddress if it's not present but verified", async () => {
    const kit = await getContractKitAsync()
    const stats: AttestationStat = {
      completed: 3,
      total: 3,
    }
    const mockAttestationsWrapper = {
      getAttestationStat: jest.fn(() => stats),
    }

    await expectSaga(runVerificationMigration)
      .provide([
        [select(ranVerificationMigrationSelector), false],
        [select(numberVerifiedSelector), false],
        [select(mtwAddressSelector), null],
        [select(komenciContextSelector), { unverifiedMtwAddress: mockAccount }],
        [select(e164NumberSelector), mockE164Number],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
        [call([kit.contracts, kit.contracts.getAttestations]), mockAttestationsWrapper],
      ])
      .put(verificationMigrationRan(mockAccount, true))
      .run()
  })

  it("doesn't change anything if no mtwAddress is present (could be an old install)", async () => {
    await expectSaga(runVerificationMigration)
      .provide([
        [select(ranVerificationMigrationSelector), false],
        [select(numberVerifiedSelector), true],
        [select(mtwAddressSelector), null],
        [select(komenciContextSelector), { unverifiedMtwAddress: null }],
        [select(e164NumberSelector), mockE164Number],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
      ])
      .put(verificationMigrationRan(null, true))
      .run()
  })

  it("doesn't run if it already has", async () => {
    const kit = await getContractKitAsync()
    const stats: AttestationStat = {
      completed: 3,
      total: 3,
    }
    const mockAttestationsWrapper = {
      getAttestationStat: jest.fn(() => stats),
    }

    await expectSaga(runVerificationMigration)
      .provide([
        [select(ranVerificationMigrationSelector), true],
        [select(numberVerifiedSelector), false],
        [select(mtwAddressSelector), mockAccount],
        [select(komenciContextSelector), { unverifiedMtwAddress: mockAccount }],
        [select(e164NumberSelector), mockE164Number],
        [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
        [call([kit.contracts, kit.contracts.getAttestations]), mockAttestationsWrapper],
      ])
      .not.put(verificationMigrationRan(mockAccount, true))
      .run()
  })
})
