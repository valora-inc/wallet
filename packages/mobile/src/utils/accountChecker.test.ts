import * as Keychain from 'react-native-keychain'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { deleteNodeData } from 'src/geth/geth'
import { resetStateOnInvalidStoredAccount } from 'src/utils/accountChecker'
import { walletAddressSelector } from 'src/web3/selectors'
import { getMockStoreData } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/geth/geth')

const mockedKeychain = mocked(Keychain)
const mockedAnalytics = mocked(ValoraAnalytics)
const mockedDeleteNodeData = mocked(deleteNodeData)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('resetStateOnInvalidStoredAccount', () => {
  it("returns the same state when there's no account", async () => {
    const state = getMockStoreData({ web3: { account: null } })
    expect(walletAddressSelector(state)).toEqual(null)
    const result = await resetStateOnInvalidStoredAccount(state)

    expect(result === state).toEqual(true)
    expect(mockedDeleteNodeData).toHaveBeenCalledTimes(0)
  })

  it('returns the same state when given an invalid state', async () => {
    const invalidState: any = {}
    const result = await resetStateOnInvalidStoredAccount(invalidState)

    expect(result === invalidState).toEqual(true)
    expect(mockedDeleteNodeData).toHaveBeenCalledTimes(0)
  })

  it("returns the same state when there's an account and a matching password hash in the keychain", async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some hash',
      server: 'server',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const state = getMockStoreData()
    expect(walletAddressSelector(state)).toEqual('0x0000000000000000000000000000000000007e57')
    const result = await resetStateOnInvalidStoredAccount(state)

    expect(result === state).toEqual(true)
    expect(mockedDeleteNodeData).toHaveBeenCalledTimes(0)
  })

  it("returns an undefined state when there's an account and no matching password hash in the keychain", async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)
    const state = getMockStoreData()
    expect(walletAddressSelector(state)).toEqual('0x0000000000000000000000000000000000007e57')
    const result = await resetStateOnInvalidStoredAccount(state)

    expect(result === undefined).toEqual(true)
    expect(mockedDeleteNodeData).toHaveBeenCalledTimes(1)
    expect(mockedAnalytics.track).toHaveBeenCalledWith('redux_no_matching_keychain_account', {
      walletAddress: '0x0000000000000000000000000000000000007e57',
    })
  })
})
