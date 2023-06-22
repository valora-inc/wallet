import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { handleFetchMyNfts } from 'src/nfts/saga'
import { fetchMyNftsCompleted, fetchMyNftsFailed } from 'src/nfts/slice'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockNftAllFields, mockNftMinimumFields } from 'test/values'

jest.mock('src/statsig')

describe('Nfts saga', () => {
  describe('Handles fetching users Nfts', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
    })

    it('fetches the users NFTs', async () => {
      mockFetch.mockResponse(
        JSON.stringify({
          result: {
            nfts: [mockNftAllFields, mockNftMinimumFields],
          },
        })
      )

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
  })
})
