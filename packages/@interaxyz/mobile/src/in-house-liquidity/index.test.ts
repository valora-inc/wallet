import { FiatConnectApiClient } from '@fiatconnect/fiatconnect-sdk'
import { KycSchema, KycStatus as FiatConnectKycStatus } from '@fiatconnect/fiatconnect-types'
import { FetchMock } from 'jest-fetch-mock/types'
import { KycStatus as PersonaKycStatus } from 'src/account/reducer'
import { FiatConnectProviderInfo } from 'src/fiatconnect'
import { getFiatConnectClient } from 'src/fiatconnect/clients'
import {
  AUTH_COOKIE,
  createPersonaAccount,
  deleteKyc,
  getAuthHeaders,
  getKycStatus,
  makeRequest,
  postKyc,
  verifyWalletAddress,
} from 'src/in-house-liquidity/index'
import networkConfig from 'src/web3/networkConfig'

const mockFetch = fetch as FetchMock

jest.mock('src/in-house-liquidity/client', () => ({
  getClient: jest.fn(() => ({
    fetch: jest.fn(mockFetch),
  })),
}))

jest.mock('src/in-house-liquidity/index', () => {
  const original = jest.requireActual('src/in-house-liquidity/index')
  return {
    ...original,
    getAuthHeaders: jest.spyOn(original, 'getAuthHeaders'),
    makeRequest: jest.spyOn(original, 'makeRequest'),
  }
})

jest.mock('src/fiatconnect/clients', () => {
  const mockFCClient = {
    isLoggedIn: jest.fn(),
    login: jest.fn(),
    getCookies: jest.fn(),
  }
  return {
    getFiatConnectClient: jest.fn(() => mockFCClient),
  }
})

describe('In House Liquidity Calls', () => {
  const mockProviderInfo: FiatConnectProviderInfo = {
    id: 'provider-id',
    providerName: 'provider-name',
    imageUrl: 'image-url',
    baseUrl: 'some-url',
    websiteUrl: 'website-url',
    iconUrl: 'icon-url',
    termsAndConditionsUrl: 'terms-url',
    privacyPolicyUrl: 'privacy-url',
    isNew: {
      in: true,
      out: false,
    },
  }
  beforeEach(() => {
    mockFetch.resetMocks()
    jest.clearAllMocks()
  })

  describe('verifyWalletAddress', () => {
    it('throws when walletAddress is null', () => {
      expect(() =>
        verifyWalletAddress({
          walletAddress: null,
        })
      ).toThrow('Cannot call IHL because walletAddress is null')
    })
  })

  describe('makeRequest', () => {
    it('makes a FC authenticated call if provider info is passed', async () => {
      jest.mocked(getAuthHeaders).mockResolvedValueOnce({ 'header-key': 'header-val' })
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      await makeRequest({
        providerInfo: mockProviderInfo,
        path: '/some/path',
        options: {
          method: 'POST',
          body: "{ some: 'data' }",
        },
      })

      expect(getAuthHeaders).toHaveBeenCalledWith({ providerInfo: mockProviderInfo })
      expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.inHouseLiquidityURL}/some/path`, {
        headers: {
          'Content-Type': 'application/json',
          'header-key': 'header-val',
        },
        method: 'POST',
        body: "{ some: 'data' }",
      })
    })
    it('makes a FC unauthenticated call if provider info is not passed', async () => {
      mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })
      await makeRequest({
        path: '/some/path',
        options: {
          method: 'GET',
        },
      })
      expect(mockFetch).toHaveBeenCalledWith(`${networkConfig.inHouseLiquidityURL}/some/path`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
    })
  })

  describe('getAuthHeaders', () => {
    let mockFiatConnectClient: jest.Mocked<FiatConnectApiClient>

    beforeEach(async () => {
      mockFiatConnectClient = (await getFiatConnectClient(
        'id',
        'url',
        'key'
      )) as jest.Mocked<FiatConnectApiClient>
    })

    it('logs in if not logged in', async () => {
      mockFiatConnectClient.isLoggedIn.mockReturnValueOnce(true)
      mockFiatConnectClient.getCookies.mockReturnValueOnce({ some: 'cookie' })
      const authHeaders = await getAuthHeaders({ providerInfo: mockProviderInfo })
      expect(mockFiatConnectClient.login).not.toHaveBeenCalled()
      expect(authHeaders).toEqual({
        [AUTH_COOKIE]: '{"some":"cookie"}',
      })
    })

    it('does not log in if already logged in', async () => {
      mockFiatConnectClient.isLoggedIn.mockReturnValueOnce(false)
      mockFiatConnectClient.getCookies.mockReturnValueOnce({ one: 'cookie', another: 'cookie' })
      const authHeaders = await getAuthHeaders({ providerInfo: mockProviderInfo })
      expect(mockFiatConnectClient.login).toHaveBeenCalled()
      expect(authHeaders).toEqual({
        [AUTH_COOKIE]: '{"one":"cookie","another":"cookie"}',
      })
    })
  })

  describe('getKycStatus', () => {
    it('throws if response not OK', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response('', { status: 418 }))
      await expect(
        getKycStatus({
          providerInfo: mockProviderInfo,
          kycSchemas: [KycSchema.PersonalDataAndDocuments],
        })
      ).rejects.toEqual(new Error('Got non-ok response from IHL while fetching KYC: 418'))
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id?kycSchemas=PersonalDataAndDocuments',
        options: { method: 'GET' },
      })
    })
    it('returns KYC status if response is OK', async () => {
      const mockGetKycStatusResponse = {
        providerId: 'some-provider',
        kycStatus: {
          [KycSchema.PersonalDataAndDocuments]: FiatConnectKycStatus.KycApproved,
        },
        persona: PersonaKycStatus.Approved,
      }
      jest
        .mocked(makeRequest)
        .mockResolvedValueOnce(new Response(JSON.stringify(mockGetKycStatusResponse)))
      const getKycStatusResponse = await getKycStatus({
        providerInfo: mockProviderInfo,
        kycSchemas: [KycSchema.PersonalDataAndDocuments],
      })
      expect(getKycStatusResponse).toEqual(mockGetKycStatusResponse)
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id?kycSchemas=PersonalDataAndDocuments',
        options: { method: 'GET' },
      })
    })
  })

  describe('postKyc', () => {
    it('throws if response not OK', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response('', { status: 418 }))
      await expect(
        postKyc({
          providerInfo: mockProviderInfo,
          kycSchema: KycSchema.PersonalDataAndDocuments,
        })
      ).rejects.toEqual(new Error('Got non-ok response from IHL while posting KYC: 418'))
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id/PersonalDataAndDocuments',
        options: { method: 'POST' },
      })
    })
    it('silently succeeds if response is OK', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response())
      const postKycResponse = await postKyc({
        providerInfo: mockProviderInfo,
        kycSchema: KycSchema.PersonalDataAndDocuments,
      })
      expect(postKycResponse).toBeUndefined()
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id/PersonalDataAndDocuments',
        options: { method: 'POST' },
      })
    })
  })

  describe('deleteKyc', () => {
    it('throws if response not OK', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response('', { status: 400 }))
      await expect(
        deleteKyc({
          providerInfo: mockProviderInfo,
          kycSchema: KycSchema.PersonalDataAndDocuments,
        })
      ).rejects.toEqual(new Error('Got non-ok/404 response from IHL while deleting KYC: 400'))
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id/PersonalDataAndDocuments',
        options: { method: 'DELETE' },
      })
    })
    it('silently succeeds if response is OK', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response())
      const deleteKycResponse = await deleteKyc({
        providerInfo: mockProviderInfo,
        kycSchema: KycSchema.PersonalDataAndDocuments,
      })
      expect(deleteKycResponse).toBeUndefined()
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id/PersonalDataAndDocuments',
        options: { method: 'DELETE' },
      })
    })
    it('silently succeeds if response is 404', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response('', { status: 404 }))
      const deleteKycResponse = await deleteKyc({
        providerInfo: mockProviderInfo,
        kycSchema: KycSchema.PersonalDataAndDocuments,
      })
      expect(deleteKycResponse).toBeUndefined()
      expect(makeRequest).toHaveBeenCalledWith({
        providerInfo: mockProviderInfo,
        path: '/fiatconnect/kyc/provider-id/PersonalDataAndDocuments',
        options: { method: 'DELETE' },
      })
    })
  })

  describe('createPersonaAccount', () => {
    it('throws if response is not OK or 409', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response('', { status: 418 }))
      await expect(
        createPersonaAccount({
          walletAddress: 'some-address',
        })
      ).rejects.toEqual(
        new Error('Got non-ok/409 response from IHL while creating Persona account: 418')
      )
      expect(makeRequest).toHaveBeenCalledWith({
        path: '/persona/account/create',
        options: {
          method: 'POST',
          body: '{"accountAddress":"some-address"}',
        },
      })
    })
    it('silently succeeds if response is OK', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response())
      const createPersonaAccountResponse = await createPersonaAccount({
        walletAddress: 'some-address',
      })
      expect(createPersonaAccountResponse).toBeUndefined()
      expect(makeRequest).toHaveBeenCalledWith({
        path: '/persona/account/create',
        options: {
          method: 'POST',
          body: '{"accountAddress":"some-address"}',
        },
      })
    })
    it('silently succeeds if response is 409', async () => {
      jest.mocked(makeRequest).mockResolvedValueOnce(new Response('', { status: 409 }))
      const createPersonaAccountResponse = await createPersonaAccount({
        walletAddress: 'some-address',
      })
      expect(createPersonaAccountResponse).toBeUndefined()
      expect(makeRequest).toHaveBeenCalledWith({
        path: '/persona/account/create',
        options: {
          method: 'POST',
          body: '{"accountAddress":"some-address"}',
        },
      })
    })
  })
})
