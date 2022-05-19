import { FetchMock } from 'jest-fetch-mock'
import { getFiatConnectProviders } from './index'
import { FiatConnectClientConfig } from '@fiatconnect/fiatconnect-sdk'
import { Network } from '@fiatconnect/fiatconnect-types'
import Logger from '../utils/Logger'

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
  describe('loginWithFiatConnectProvider', () => {})
})
