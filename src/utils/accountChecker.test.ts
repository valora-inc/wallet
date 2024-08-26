import * as Sentry from '@sentry/react-native'
import * as Keychain from 'react-native-keychain'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { resetStateOnInvalidStoredAccount } from 'src/utils/accountChecker'
import { clearStoredAccounts } from 'src/web3/KeychainAccounts'
import { walletAddressSelector } from 'src/web3/selectors'
import { getMockStoreData } from 'test/utils'

jest.mock('src/web3/KeychainAccounts')

const mockedKeychain = jest.mocked(Keychain)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('resetStateOnInvalidStoredAccount', () => {
  it("returns the same state when there's no account", async () => {
    const state = getMockStoreData({ web3: { account: null } })
    expect(walletAddressSelector(state)).toEqual(null)
    const result = await resetStateOnInvalidStoredAccount(state)

    expect(result === state).toEqual(true)
    expect(clearStoredAccounts).toHaveBeenCalledTimes(0)
    expect(Sentry.captureException).toHaveBeenCalledTimes(0)
  })

  it('returns the same state when given an invalid state', async () => {
    const invalidState: any = {}
    const result = await resetStateOnInvalidStoredAccount(invalidState)

    expect(result === invalidState).toEqual(true)
    expect(clearStoredAccounts).toHaveBeenCalledTimes(0)
    expect(Sentry.captureException).toHaveBeenCalledTimes(1)
  })

  it('returns the same state when given an undefined state', async () => {
    const result = await resetStateOnInvalidStoredAccount(undefined)

    expect(result === undefined).toEqual(true)
    expect(clearStoredAccounts).toHaveBeenCalledTimes(0)
    // This is normal flow, we don't expect an exception
    expect(Sentry.captureException).toHaveBeenCalledTimes(0)
  })

  it("returns the same state when there's an account and a matching password hash in the keychain", async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue({
      password: 'some hash',
      username: 'username',
      service: 'service',
      storage: 'storage',
    })
    const state = getMockStoreData()
    expect(walletAddressSelector(state)).toEqual('0x0000000000000000000000000000000000007e57')
    const result = await resetStateOnInvalidStoredAccount(state)

    expect(result === state).toEqual(true)
    expect(clearStoredAccounts).toHaveBeenCalledTimes(0)
    expect(Sentry.captureException).toHaveBeenCalledTimes(0)
  })

  it("returns an undefined state when there's an account and no matching password hash in the keychain", async () => {
    mockedKeychain.getGenericPassword.mockResolvedValue(false)
    const state = getMockStoreData()
    expect(walletAddressSelector(state)).toEqual('0x0000000000000000000000000000000000007e57')
    const result = await resetStateOnInvalidStoredAccount(state)

    expect(result === undefined).toEqual(true)
    expect(clearStoredAccounts).toHaveBeenCalledTimes(1)
    expect(Sentry.captureException).toHaveBeenCalledTimes(0)
    expect(AppAnalytics.track).toHaveBeenCalledWith('redux_no_matching_keychain_account', {
      walletAddress: '0x0000000000000000000000000000000000007e57',
    })
  })
})
