import { verifyWallet } from '@celo/komencikit/src/verifyWallet'
import * as reduxSagaTestPlan from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import networkConfig from 'src/geth/networkConfig'
import {
  checkIfKomenciAvailableSaga,
  fetchKomenciReadiness,
  fetchOrDeployMtwSaga,
  getKomenciAwareAccount,
  getKomenciKit,
} from 'src/verify/komenci'
import {
  e164NumberSelector,
  fail,
  fetchOnChainData,
  KomenciAvailable,
  komenciContextSelector,
  phoneHashSelector,
  setKomenciAvailable,
  setKomenciContext,
  setVerificationStatus,
  shouldUseKomenciSelector,
} from 'src/verify/module'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { registerWalletAndDekViaKomenci } from 'src/web3/dataEncryptionKey'
import { getAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import {
  mockAccount,
  mockAccount1,
  mockAccount3,
  mockE164Number,
  mockE164NumberHash,
  mockKomenciContext,
  mockPublicDEK,
} from 'test/values'

export const mockKomenciKit = {
  getDistributedBlindedPepper: jest.fn(),
  deployWallet: jest.fn(),
}

export const mockAccountsWrapper = {
  getWalletAddress: jest.fn(() => Promise.resolve(mockAccount)),
  getDataEncryptionKey: jest.fn(() => Promise.resolve(mockPublicDEK)),
}

export const mockAttestationsWrapper = {
  lookupAccountsForIdentifier: jest.fn(),
  getVerifiedStatus: jest.fn(),
  getRevealStatus: jest.fn(),
  getActionableAttestations: jest.fn(),
}

describe(getKomenciAwareAccount, () => {
  it('get MTW wallet address', async () => {
    await reduxSagaTestPlan
      .expectSaga(getKomenciAwareAccount)
      .provide([
        [
          select(komenciContextSelector),
          { ...mockKomenciContext, unverifiedMtwAddress: mockAccount3 },
        ],
        [select(shouldUseKomenciSelector), true],
      ])
      .returns(mockAccount3)
      .run()
  })

  it('get account address', async () => {
    await reduxSagaTestPlan
      .expectSaga(getKomenciAwareAccount)
      .provide([
        [select(komenciContextSelector), mockKomenciContext],
        [select(shouldUseKomenciSelector), false],
        [call(getConnectedUnlockedAccount), mockAccount],
      ])
      .returns(mockAccount)
      .run()
  })
})

describe(checkIfKomenciAvailableSaga, () => {
  it('sets komenci availability', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    await reduxSagaTestPlan
      .expectSaga(checkIfKomenciAvailableSaga)
      .provide([
        [call(getContractKit), contractKit],
        [call(getAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [call(fetchKomenciReadiness, komenciKit), true],
      ])
      .put(setKomenciAvailable(KomenciAvailable.Yes))
      .run()
  })
})

describe(fetchOrDeployMtwSaga, () => {
  it('fails on multiple verified addresses', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue(['0', '1'])
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: true,
    })
    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), mockE164NumberHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [
          call(
            verifyWallet,
            contractKit,
            '0',
            networkConfig.allowedMtwImplementations,
            mockAccount
          ),
          { ok: true },
        ],
        [
          call(
            verifyWallet,
            contractKit,
            '1',
            networkConfig.allowedMtwImplementations,
            mockAccount
          ),
          { ok: true },
        ],
      ])
      .put(
        fail('More than one verified MTW with walletAddress as signer found. Should never happen')
      )
      .run()
  })

  it('succeeds for fresh new account', async () => {
    const contractKit = await getContractKitAsync()
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue([])
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: true,
    })
    ;(mockKomenciKit.deployWallet as jest.Mock).mockReturnValue({ ok: true, result: mockAccount1 })
    const mockKomenciContextActive = {
      ...mockKomenciContext,
      sessionActive: true,
    }
    const mockVerifyWallet = jest.fn()
    ;(mockVerifyWallet as jest.Mock).mockReturnValueOnce({
      ok: true,
    })
    const mockRegisterWalletAndDekViaKomenci = jest.fn()
    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContextActive],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContextActive), mockKomenciKit],
        [select(phoneHashSelector), mockE164NumberHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        {
          call: ({ fn }, next) => (fn === verifyWallet ? mockVerifyWallet() : next()),
        },
        {
          call: ({ fn }, next) =>
            fn === registerWalletAndDekViaKomenci ? mockRegisterWalletAndDekViaKomenci() : next(),
        },
      ])
      .put(setKomenciContext({ unverifiedMtwAddress: mockAccount1 }))
      .put(fetchOnChainData())
      .run()
    expect(mockRegisterWalletAndDekViaKomenci.mock.calls.length).toBe(1)
  })

  it('succeeds for already cached unverified MTW address', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue([
      mockAccount1,
    ])
    const mockKomenciContextWithUnverifiedMtwAddress = {
      ...mockKomenciContext,
      unverifiedMtwAddress: mockAccount1,
      sessionActive: true,
    }
    const mockVerifyWallet = jest.fn()
    ;(mockVerifyWallet as jest.Mock).mockReturnValueOnce({
      ok: false,
    })
    ;(mockVerifyWallet as jest.Mock).mockReturnValueOnce({
      ok: true,
    })
    const mockRegisterWalletAndDekViaKomenci = jest.fn()
    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContextWithUnverifiedMtwAddress],
        [
          call(getKomenciKit, contractKit, mockAccount, mockKomenciContextWithUnverifiedMtwAddress),
          komenciKit,
        ],
        [select(phoneHashSelector), mockE164NumberHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        {
          call: ({ fn }, next) => (fn === verifyWallet ? mockVerifyWallet() : next()),
        },
        {
          call: ({ fn }, next) =>
            fn === registerWalletAndDekViaKomenci ? mockRegisterWalletAndDekViaKomenci() : next(),
        },
      ])
      .put(setKomenciContext({ unverifiedMtwAddress: mockAccount1 }))
      .put(fetchOnChainData())
      .run()
    expect(mockRegisterWalletAndDekViaKomenci.mock.calls.length).toBe(1)
  })

  it('succeeds if already deployed wallet is a valid MTW', async () => {
    const contractKit = await getContractKitAsync()
    const komenciKit = getKomenciKit(contractKit, mockAccount, mockKomenciContext)
    ;(mockAttestationsWrapper.lookupAccountsForIdentifier as jest.Mock).mockReturnValue([
      mockAccount1,
    ])
    ;(mockAttestationsWrapper.getVerifiedStatus as jest.Mock).mockReturnValue({
      isVerified: true,
    })

    await reduxSagaTestPlan
      .expectSaga(fetchOrDeployMtwSaga)
      .provide([
        [select(e164NumberSelector), mockE164Number],
        [call(getContractKit), contractKit],
        [call(getConnectedUnlockedAccount), mockAccount],
        [select(komenciContextSelector), mockKomenciContext],
        [call(getKomenciKit, contractKit, mockAccount, mockKomenciContext), komenciKit],
        [select(shouldUseKomenciSelector), false],
        [select(phoneHashSelector), mockE164NumberHash],
        [
          call([contractKit.contracts, contractKit.contracts.getAttestations]),
          mockAttestationsWrapper,
        ],
        [
          call(
            verifyWallet,
            contractKit,
            mockAccount1,
            networkConfig.allowedMtwImplementations,
            mockAccount
          ),
          { ok: true },
        ],
      ])
      .put(
        setKomenciContext({
          unverifiedMtwAddress: mockAccount1,
        })
      )
      .put(
        setVerificationStatus({
          isVerified: true,
        })
      )
      .run()
  })
})
