import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { handleFetchMyNfts } from 'src/nfts/saga'
import { fetchMyNftsCompleted, fetchMyNftsFailed } from 'src/nfts/slice'
import { getFeatureGate } from 'src/statsig'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockNftAllFields, mockNftMinimumFields } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/statsig')

const nftResponse = JSON.stringify({
  result: {
    nfts: [mockNftAllFields, mockNftMinimumFields],
  },
})

describe('Nfts saga', () => {
  describe('Handles fetching users Nfts', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
    })

    it('fetches the users NFTs', async () => {
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

    it('saves an error', async () => {
      mocked(getFeatureGate).mockReturnValue(true)
      mockFetch.mockRejectOnce()

      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .put(
          fetchMyNftsFailed({
            error: 'Could not fetch nfts',
          })
        )
        .run()
    })

    it('is disabled by feature flag', async () => {
      mocked(getFeatureGate).mockReturnValue(false)
      mockFetch.mockResponse(nftResponse)

      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .not.put(fetchMyNftsCompleted({ nfts: [mockNftAllFields, mockNftMinimumFields] }))
        .run()
    })

    it('is disabled by default', async () => {
      mockFetch.mockResponse(nftResponse)
      await expectSaga(handleFetchMyNfts)
        .provide([[select(walletAddressSelector), '0xabc']])
        .not.put(fetchMyNftsCompleted({ nfts: [mockNftAllFields, mockNftMinimumFields] }))
        .run()
    })
  })
})
