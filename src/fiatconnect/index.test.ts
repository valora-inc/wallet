import { FetchMock } from 'jest-fetch-mock'
import { getFiatConnectProviders, loginWithFiatConnectProvider } from './index'
import { FiatConnectClient, FiatConnectClientConfig } from '@fiatconnect/fiatconnect-sdk'
import { Network } from '@fiatconnect/fiatconnect-types'
import Logger from '../utils/Logger'
import { GethNativeBridgeWallet } from 'src/geth/GethNativeBridgeWallet'
import { mocked } from 'ts-jest/utils'
import { getPassword } from 'src/pincode/authentication'

jest.mock('src/pincode/authentication')

jest.mock('src/geth/GethNativeBridgeWallet', () => {
  return {
    GethNativeBridgeWallet: () => {
      return jest.fn(() => {
        return {}
      })
    },
  }
})

jest.mock('@fiatconnect/fiatconnect-sdk', () => {
  return {
    FiatConnectClient: () => {
      return jest.fn(() => {
        return {}
      })
    },
  }
})

const MockGethNativeBridgeWallet = mocked(GethNativeBridgeWallet)
const MockFiatConnectClient = mocked(FiatConnectClient)

describe('FiatConnect helpers', () => {
  const mockFetch = fetch as FetchMock
  beforeEach(() => {
    mockFetch.resetMocks()
    jest.clearAllMocks()
  })
  describe('getFiatConnectProviders', () => {
    it('Gives list of providers on success', async () => {
      const fakeProviderInfo: FiatConnectClientConfig = {
        baseUrl: 'https://fake-provider.valoraapp.com',
        providerName: 'fake provider name',
        iconUrl: 'https://fake-icon.valoraapp.com',
        network: Network.Alfajores,
        accountAddress: 'fake-address',
      }
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [fakeProviderInfo] }), { status: 200 })
      const providers = await getFiatConnectProviders()
      expect(providers).toMatchObject([fakeProviderInfo])
    })
    it('Gives empty list and logs error on failure', async () => {
      const mockLogError = jest.fn()
      jest.spyOn(Logger, 'error').mockImplementation(mockLogError)
      mockFetch.mockResponseOnce(JSON.stringify({ providers: [] }), { status: 500 })
      const providers = await getFiatConnectProviders()
      expect(mockLogError).toHaveBeenCalled()
      expect(providers).toEqual([])
    })
  })
  describe('loginWithFiatConnectProvider', () => {
    let wallet: GethNativeBridgeWallet
    let fiatConnectClient: FiatConnectClient

    beforeEach(() => {
      wallet = new MockGethNativeBridgeWallet()
      wallet.getAccounts = jest.fn().mockReturnValue(['fakeAccount'])
      wallet.isAccountUnlocked = jest.fn().mockReturnValue(true)
      wallet.unlockAccount = jest.fn().mockResolvedValue()

      fiatConnectClient = new MockFiatConnectClient()
      fiatConnectClient.isLoggedIn = jest.fn().mockReturnValue(true)
      fiatConnectClient.login = jest.fn().mockResolvedValue({ ok: true })
    })
    it('Does not attempt to login if already logged in', async () => {
      await expect(loginWithFiatConnectProvider(wallet, fiatConnectClient)).resolves.toBeUndefined()
      expect(fiatConnectClient.login).not.toHaveBeenCalled()
    })
    it('Forces login attempt if already logged in', async () => {
      await expect(
        loginWithFiatConnectProvider(wallet, fiatConnectClient, true)
      ).resolves.toBeUndefined()
      expect(fiatConnectClient.login).toHaveBeenCalled()
    })
    it('Attempts to login and prompts PIN when account is locked', async () => {
      wallet.isAccountUnlocked = jest.fn().mockReturnValue(false)
      fiatConnectClient.isLoggedIn = jest.fn().mockReturnValue(false)
      await expect(loginWithFiatConnectProvider(wallet, fiatConnectClient)).resolves.toBeUndefined()
      expect(wallet.unlockAccount).toHaveBeenCalled()
      expect(getPassword).toHaveBeenCalled()
      expect(fiatConnectClient.login).toHaveBeenCalled()
    })
    it('Attempts to login without prompting for PIN when account is unlocked', async () => {
      wallet.isAccountUnlocked = jest.fn().mockReturnValue(true)
      fiatConnectClient.isLoggedIn = jest.fn().mockReturnValue(false)
      await expect(loginWithFiatConnectProvider(wallet, fiatConnectClient)).resolves.toBeUndefined()
      expect(wallet.unlockAccount).not.toHaveBeenCalled()
      expect(getPassword).not.toHaveBeenCalled()
      expect(fiatConnectClient.login).toHaveBeenCalled()
    })
    it('Throws an error when login fails', async () => {
      wallet.isAccountUnlocked = jest.fn().mockReturnValue(true)
      fiatConnectClient.isLoggedIn = jest.fn().mockReturnValue(false)
      fiatConnectClient.login = jest.fn().mockResolvedValue({
        ok: false,
        val: {
          error: 'error',
        },
      })
      await expect(loginWithFiatConnectProvider(wallet, fiatConnectClient)).rejects.toThrow()
    })
  })
  describe('getSigningFunction', () => {
    it('Does not attempt to login if already logged in', async () => {})
  })
})
