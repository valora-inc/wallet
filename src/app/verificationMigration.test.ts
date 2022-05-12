import { AttestationStat } from '@celo/contractkit/lib/wrappers/Attestations'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga-test-plan/matchers'
import { StaticProvider } from 'redux-saga-test-plan/providers'
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

const mockMTW = mockAccount

describe('verificationMigration', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
  })

  async function commonProvides({
    numberVerified,
    mtwAddress,
    unverifiedMtwAddress,
    attestationStats,
  }: {
    numberVerified: boolean
    mtwAddress: string | null
    unverifiedMtwAddress?: string | null
    attestationStats: AttestationStat
  }): Promise<StaticProvider[]> {
    const kit = await getContractKitAsync()
    const mockAttestationsWrapper = {
      getAttestationStat: jest.fn(() => attestationStats),
    }

    return [
      [select(ranVerificationMigrationSelector), false],
      [select(numberVerifiedSelector), numberVerified],
      [select(mtwAddressSelector), mtwAddress],
      [
        select(komenciContextSelector),
        {
          unverifiedMtwAddress:
            unverifiedMtwAddress === undefined ? mtwAddress : unverifiedMtwAddress,
        },
      ],
      [select(e164NumberSelector), mockE164Number],
      [select(e164NumberToSaltSelector), { [mockE164Number]: mockE164NumberPepper }],
      [call([kit.contracts, kit.contracts.getAttestations]), mockAttestationsWrapper],
    ]
  }

  it("doesn't change anything if mtwAddress is present and verified", async () => {
    await expectSaga(runVerificationMigration)
      .provide(
        await commonProvides({
          numberVerified: true,
          mtwAddress: mockMTW,
          attestationStats: {
            completed: 3,
            total: 3,
          },
        })
      )
      .put(verificationMigrationRan(mockMTW, true))
      .run()
  })

  it("doesn't change anything if mtwAddress is not present and not verified", async () => {
    await expectSaga(runVerificationMigration)
      .provide(
        await commonProvides({
          numberVerified: true,
          mtwAddress: null,
          unverifiedMtwAddress: mockMTW,
          attestationStats: {
            completed: 2,
            total: 3,
          },
        })
      )
      .put(verificationMigrationRan(null, false))
      .run()
  })

  it("deletes the mtwAddress if it's present but not verified", async () => {
    await expectSaga(runVerificationMigration)
      .provide(
        await commonProvides({
          numberVerified: true,
          mtwAddress: mockMTW,
          attestationStats: {
            completed: 2,
            total: 3,
          },
        })
      )
      .put(verificationMigrationRan(null, false))
      .run()
  })

  it("sets the mtwAddress if it's not present but verified", async () => {
    await expectSaga(runVerificationMigration)
      .provide(
        await commonProvides({
          numberVerified: false,
          mtwAddress: null,
          unverifiedMtwAddress: mockMTW,
          attestationStats: {
            completed: 3,
            total: 3,
          },
        })
      )
      .put(verificationMigrationRan(mockMTW, true))
      .run()
  })

  it("doesn't change anything if no mtwAddress is present", async () => {
    await expectSaga(runVerificationMigration)
      .provide(
        await commonProvides({
          numberVerified: false,
          mtwAddress: null,
          unverifiedMtwAddress: null,
          attestationStats: {
            completed: 3,
            total: 3,
          },
        })
      )
      .put(verificationMigrationRan(null, false))
      .run()
  })

  it("doesn't run if it already has", async () => {
    await expectSaga(runVerificationMigration)
      .provide([[select(ranVerificationMigrationSelector), true]])
      .not.put(verificationMigrationRan(expect.anything(), expect.anything()))
      .run()
  })
})
