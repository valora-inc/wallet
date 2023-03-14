import { rewardsEnabledSelector } from 'src/app/selectors'
import { getMockStoreData } from 'test/utils'

describe(rewardsEnabledSelector, () => {
  const superchargeTokenConfigByToken = { '0xabc': { minBalance: 0, maxBalance: 100 } }
  it('returns true if MTW non-null and supercharge config non-empty', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: '0x123' },
          app: { superchargeTokenConfigByToken },
        })
      )
    ).toEqual(true)
  })
  it('returns true if wallet address non-null and supercharge config non-empty', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: null, account: '0x123' },
          app: { superchargeTokenConfigByToken },
        })
      )
    ).toEqual(true)
  })
  it('returns false if supercharge config empty', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: null, account: '0x123' },
          app: { superchargeTokenConfigByToken: {} },
        })
      )
    ).toEqual(false)
  })
  it('returns false if wallet address and MTW are null', () => {
    expect(
      rewardsEnabledSelector(
        getMockStoreData({
          web3: { mtwAddress: null, account: null },
          app: { superchargeTokenConfigByToken },
        })
      )
    ).toEqual(false)
  })
  // NOTE: the case where MTW is non-null and wallet address is null should not be possible, and it's not clear
  //  whether rewards should be enabled if it did occur (where would we even send the rewards?). so it is intentionally
  //  not covered.
})
