import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { select } from 'redux-saga/effects'
import { Actions, celebratedNftFound } from 'src/home/actions'
import { celebratedNftSelector } from 'src/home/selectors'
import * as nftSaga from 'src/nfts/saga'
import { handleFetchNfts, watchFirstFetchCompleted } from 'src/nfts/saga'
import { fetchNftsCompleted, fetchNftsFailed } from 'src/nfts/slice'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockNftAllFields, mockNftMinimumFields } from 'test/values'

jest.mock('src/statsig')

const loggerDebugSpy = jest.spyOn(Logger, 'debug')
const loggerErrorSpy = jest.spyOn(Logger, 'error')

const nftResponse1 = JSON.stringify({
  result: [mockNftAllFields],
})

const nftResponse2 = JSON.stringify({
  result: [mockNftMinimumFields],
})

describe('Given Nfts saga', () => {
  describe('When fetching users Nfts', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
      jest.clearAllMocks()
      jest.mocked(getDynamicConfigParams).mockReturnValue({
        showNfts: [NetworkId['celo-alfajores'], NetworkId['ethereum-sepolia']],
      })
    })

    it("should fetch user's NFTs", async () => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockResponseOnce(nftResponse1)
      mockFetch.mockResponseOnce(nftResponse2)

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchNftsCompleted({
            nfts: [
              { ...mockNftAllFields, networkId: NetworkId['celo-alfajores'] },
              { ...mockNftMinimumFields, networkId: NetworkId['ethereum-sepolia'] },
            ],
          })
        )
        .run()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.alfajores.valora.xyz/getNfts?address=0xabc&networkId=celo-alfajores',
        {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          method: 'GET',
          signal: expect.any(AbortSignal),
        }
      )
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.alfajores.valora.xyz/getNfts?address=0xabc&networkId=ethereum-sepolia',
        {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          method: 'GET',
          signal: expect.any(AbortSignal),
        }
      )
    })

    it('should save error on parse fail', async () => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockResponseOnce('invalid json')

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchNftsFailed({
            error: `invalid json response body at  reason: Unexpected token 'i', "invalid json" is not valid JSON`,
          })
        )
        .run()

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should save error on fetch fail', async () => {
      jest.mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchNftsFailed({
            error:
              'Unable to fetch NFTs for celo-alfajores: 500 {"message":"something went wrong"}',
          })
        )
        .run()
    })

    it('should not fetch when no wallet address found', async () => {
      jest.mocked(getFeatureGate).mockReturnValue(true)

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), null]])
        .not.put.actionType(fetchNftsCompleted.type)
        .run()

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Wallet address not found, skipping NFTs list fetch'
      )
    })

    it('should be disabled by feature gate', async () => {
      jest.mocked(getFeatureGate).mockReturnValue(false)

      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .not.put.actionType(fetchNftsCompleted.type)
        .run()

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Feature gate not enabled, skipping NFTs list fetch'
      )
    })

    it('should be disabled by default', async () => {
      await expectSaga(handleFetchNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .not.put.actionType(fetchNftsCompleted.type)
        .run()
    })
  })

  describe('findCelebratedNft saga', () => {
    it('should put celebrated NFT once found', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })
      const mockCelebratedNft = {
        networkId: mockNftAllFields.networkId,
        contractAddress: mockNftAllFields.contractAddress,
      }

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockCelebratedNft)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(celebratedNftSelector), null]])
        .put(
          celebratedNftFound({
            networkId: mockCelebratedNft.networkId,
            contractAddress: mockCelebratedNft.contractAddress,
          })
        )
        .run()
    })

    it('should not put celebrated NFT if feature gate is closed', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })
      const mockCelebratedNft = {
        networkId: mockNftAllFields.networkId,
        contractAddress: mockNftAllFields.contractAddress,
      }

      jest.mocked(getFeatureGate).mockReturnValue(false)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockCelebratedNft)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(celebratedNftSelector), null]])
        .not.put.actionType(Actions.CELEBRATED_NFT_FOUND)
        .run()
    })

    it('should not put celebrated NFT if dynamic config is empty', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue({})

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(celebratedNftSelector), null]])
        .not.put.actionType(Actions.CELEBRATED_NFT_FOUND)
        .run()
    })

    it('should not put celebrated NFT if celebrated NFT already exists', () => {
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })
      const mockCelebratedNft = {
        networkId: mockNftAllFields.networkId,
        contractAddress: mockNftAllFields.contractAddress,
      }

      jest.mocked(getFeatureGate).mockReturnValue(true)
      jest.mocked(getDynamicConfigParams).mockReturnValue(mockCelebratedNft)

      return expectSaga(nftSaga.findCelebratedNft, mockAction)
        .provide([[select(celebratedNftSelector), mockCelebratedNft]])
        .not.put.actionType(Actions.CELEBRATED_NFT_FOUND)
        .run()
    })
  })

  describe('watchFirstFetchCompleted saga', () => {
    it('should call findCelebratedNft only once even if multiple fetchNftsCompleted actions are dispatched', async () => {
      const mockFindCelebratedNft = jest.fn()
      const mockAction = fetchNftsCompleted({ nfts: [mockNftAllFields] })

      await expectSaga(watchFirstFetchCompleted)
        .provide([[matchers.call.fn(nftSaga.findCelebratedNft), mockFindCelebratedNft()]])
        .dispatch(mockAction)
        .dispatch(mockAction)
        .run()

      expect(mockFindCelebratedNft).toHaveBeenCalledTimes(1)
    })
  })
})
