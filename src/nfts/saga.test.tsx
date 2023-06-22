import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { handleFetchMyNfts } from 'src/nfts/saga'
import { fetchMyNftsCompleted, fetchMyNftsFailed } from 'src/nfts/slice'
import { getFeatureGate } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockNftAllFields, mockNftMinimumFields } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')

const loggerDebugSpy = jest.spyOn(Logger, 'debug')
const loggerErrorSpy = jest.spyOn(Logger, 'error')

const nftResponse = JSON.stringify({
  result: {
    nfts: [mockNftAllFields, mockNftMinimumFields],
  },
})

describe('Given Nfts saga', () => {
  describe('When fetching users Nfts', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
      jest.clearAllMocks()
    })

    it("should fetch user's NFTs", async () => {
      mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockResponse(nftResponse)

      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchMyNftsCompleted({
            nfts: [mockNftAllFields, mockNftMinimumFields],
          })
        )
        .run()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.alfajores.valora.xyz/getNfts?address=0xabc',
        {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          method: 'GET',
        }
      )
    })

    it('should save error on parse fail', async () => {
      mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockResponseOnce('invalid json')

      await expectSaga(handleFetchMyNfts)
        .provide([
          [select(walletAddressSelector), '0xabc'],
          [call([JSON, 'parse'], 'invalid json'), new Error('Unable to Parse')],
        ])
        .put(
          fetchMyNftsFailed({
            error: 'Could not parse NFTs',
          })
        )
        .run()

      expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    })

    it('should save error on fetch fail', async () => {
      mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockRejectOnce()

      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchMyNftsFailed({
            error: 'Could not fetch NFTs',
          })
        )
        .run()
    })

    it('should not fetch when no wallet address found', async () => {
      mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockResponse(nftResponse)

      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), null]])
        .not.put(fetchMyNftsCompleted({ nfts: [mockNftAllFields, mockNftMinimumFields] }))
        .run()

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Wallet address not found, skipping NFTs list fetch'
      )
    })

    it('should be disabled by feature gate', async () => {
      mocked(getFeatureGate).mockReturnValue(false)
      mockFetch.mockResponse(nftResponse)

      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .not.put(fetchMyNftsCompleted({ nfts: [mockNftAllFields, mockNftMinimumFields] }))
        .run()

      expect(loggerDebugSpy).toHaveBeenCalledWith(
        'NftsSaga',
        'Feature gate not enabled, skipping NFTs list fetch'
      )
    })

    it('should be disabled by default', async () => {
      mockFetch.mockResponse(nftResponse)
      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .not.put(fetchMyNftsCompleted({ nfts: [mockNftAllFields, mockNftMinimumFields] }))
        .run()
    })
  })
})
