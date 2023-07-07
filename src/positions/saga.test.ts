import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { fetchPositionsSaga, fetchShortcutsSaga } from 'src/positions/saga'
import {
  hooksApiUrlSelector,
  hooksPreviewApiUrlSelector,
  shortcutsStatusSelector,
} from 'src/positions/selectors'
import {
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
  fetchShortcutsFailure,
  fetchShortcutsSuccess,
} from 'src/positions/slice'
import { getFeatureGate } from 'src/statsig'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockPositions, mockShortcuts } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/sentry/SentryTransactionHub')
jest.mock('src/statsig')
jest.mock('src/utils/Logger')

const MOCK_RESPONSE = {
  message: 'OK',
  data: mockPositions,
}

const MOCK_SHORTCUTS_RESPONSE = {
  message: 'OK',
  data: mockShortcuts,
}

const mockFetch = fetch as FetchMock

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.resetMocks()
})

describe(fetchPositionsSaga, () => {
  it('fetches positions successfully', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([
        [select(walletAddressSelector), mockAccount],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put(fetchPositionsStart())
      .put(fetchPositionsSuccess(MOCK_RESPONSE.data))
      .run()
  })

  it("skips fetching positions if the feature gate isn't enabled", async () => {
    mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips fetching positions if no address is available in the store', async () => {
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), null]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("dispatches an error if there's an error", async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([
        [select(walletAddressSelector), mockAccount],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put(fetchPositionsStart())
      .put.actionType(fetchPositionsFailure.type)
      .run()
  })
})

describe(fetchShortcutsSaga, () => {
  it('fetches shortcuts successfully', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_SHORTCUTS_RESPONSE))
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'idle'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put(fetchShortcutsSuccess(mockShortcuts))
      .run()
  })

  it('fetches shortcuts if the previous fetch attempt failed', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_SHORTCUTS_RESPONSE))
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'error'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put(fetchShortcutsSuccess(mockShortcuts))
      .run()
  })

  it("skips fetching shortcuts if the feature gate isn't enabled", async () => {
    mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(fetchShortcutsSaga).run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("skips fetching shortcuts if they've already been fetched", async () => {
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchShortcutsSaga)
      .provide([[select(shortcutsStatusSelector), 'success']])
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('updates the shortcuts status there is an error', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'idle'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put.actionType(fetchShortcutsFailure.type)
      .not.put(fetchShortcutsSuccess(expect.anything()))
      .run()

    expect(mockFetch).toHaveBeenCalled()
    expect(Logger.warn).toHaveBeenCalled()
  })
})
