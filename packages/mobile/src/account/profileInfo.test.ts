import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { profileUploaded } from 'src/account/actions'
import { checkIfProfileUploaded, unlockDEK, uploadNameAndPicture } from 'src/account/profileInfo'
import { isProfileUploadedSelector } from 'src/account/selectors'
import { DEK, retrieveOrGeneratePepper } from 'src/pincode/authentication'
import { getWallet } from 'src/web3/contracts'
import { dataEncryptionKeySelector } from 'src/web3/selectors'
import { mockWallet } from 'test/values'

describe(unlockDEK, () => {
  it('unlocks DEK in wallet', async () => {
    const wallet = mockWallet
    const pepper = 'asdfasdf'
    await expectSaga(unlockDEK)
      .provide([
        [
          select(dataEncryptionKeySelector),
          '0xc029c933337a6a1b08fc75c56dfba605bfbece471c356923ef79056c5f0a2e81',
        ],
        [call(retrieveOrGeneratePepper, DEK), pepper],
        [call(getWallet), wallet],
      ])
      .run()

    expect(wallet.unlockAccount).toHaveBeenCalledWith(
      '0x17dd1686f1b592c7d0869b439ddd1fcd669b352f',
      pepper,
      0
    )
  })
})

describe(checkIfProfileUploaded, () => {
  it('uploads name and picture', async () => {
    await expectSaga(checkIfProfileUploaded)
      .provide([
        [select(isProfileUploadedSelector), false],
        [call(uploadNameAndPicture), 'asdf'],
      ])
      .call.fn(uploadNameAndPicture)
      .put(profileUploaded())
      .run()
  })

  it("doesn't upload name and picture if already uploaded", async () => {
    await expectSaga(checkIfProfileUploaded)
      .provide([[select(isProfileUploadedSelector), true]])
      .not.call.fn(uploadNameAndPicture)
      .not.put(profileUploaded())
      .run()
  })
})
