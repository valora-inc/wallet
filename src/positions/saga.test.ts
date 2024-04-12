import { FetchMock } from 'jest-fetch-mock/types'
import { Platform } from 'react-native'
import { expectSaga } from 'redux-saga-test-plan'
import { EffectProviders, StaticProvider } from 'redux-saga-test-plan/providers'
import { call, select } from 'redux-saga/effects'
import { showError } from 'src/alert/actions'
import { HooksEnablePreviewOrigin } from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { isBottomSheetVisible, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  executeShortcutSaga,
  fetchPositionsSaga,
  fetchShortcutsSaga,
  handleEnableHooksPreviewDeepLink,
  triggerShortcutSaga,
  _confirmEnableHooksPreview,
} from 'src/positions/saga'
import {
  hooksApiUrlSelector,
  hooksPreviewApiUrlSelector,
  shortcutsStatusSelector,
  triggeredShortcutsStatusSelector,
} from 'src/positions/selectors'
import {
  executeShortcut,
  executeShortcutFailure,
  executeShortcutSuccess,
  fetchPositionsFailure,
  fetchPositionsStart,
  fetchPositionsSuccess,
  fetchShortcutsFailure,
  fetchShortcutsSuccess,
  previewModeEnabled,
  triggerShortcut,
  triggerShortcutFailure,
  triggerShortcutSuccess,
} from 'src/positions/slice'
import { getFeatureGate, getDynamicConfigParams } from 'src/statsig'
import Logger from 'src/utils/Logger'
import { getContractKit } from 'src/web3/contracts'
import networkConfig from 'src/web3/networkConfig'
import { getConnectedUnlockedAccount } from 'src/web3/saga'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount, mockPositions, mockShortcuts } from 'test/values'
import { NetworkId } from 'src/transactions/types'

jest.mock('src/sentry/SentryTransactionHub')
jest.mock('src/statsig')
jest.mock('src/utils/Logger')

const mockSendTransaction = jest.fn()
jest.mock('src/transactions/send', () => ({
  sendTransaction: () => mockSendTransaction(),
}))
jest.mock('react-native-simple-toast')

const MOCK_RESPONSE = {
  message: 'OK',
  data: mockPositions,
}

const MOCK_SHORTCUTS_RESPONSE = {
  message: 'OK',
  data: mockShortcuts,
}

const mockFetch = fetch as FetchMock

const originalPlatform = Platform.OS

const contractKit = {
  getWallet: jest.fn(),
  getAccounts: jest.fn(),
  connection: {
    chainId: jest.fn(() => '42220'),
    nonce: jest.fn(),
    gasPrice: jest.fn(),
    estimateGas: jest.fn(() => '1234'),
  },
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.resetMocks()
  Platform.OS = originalPlatform
})

describe(fetchPositionsSaga, () => {
  it('fetches positions successfully', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_RESPONSE))
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.mocked(getDynamicConfigParams).mockReturnValue({ showPositions: ['celo-mainnet'] })

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
    jest.mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), mockAccount]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips fetching positions if no address is available in the store', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchPositionsSaga)
      .provide([[select(walletAddressSelector), null]])
      .not.put(fetchPositionsStart())
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("dispatches an error if there's an error", async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    jest.mocked(getFeatureGate).mockReturnValue(true)

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
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      showShortcuts: ['celo-mainnet'],
    })

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'idle'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(walletAddressSelector), mockAccount],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put(fetchShortcutsSuccess(mockShortcuts))
      .run()
  })

  it('fetches shortcuts if the previous fetch attempt failed', async () => {
    mockFetch.mockResponse(JSON.stringify(MOCK_SHORTCUTS_RESPONSE))
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.mocked(getDynamicConfigParams).mockReturnValue({ showShortcuts: ['celo-mainnet'] })

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'error'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(walletAddressSelector), mockAccount],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .put(fetchShortcutsSuccess(mockShortcuts))
      .run()
  })

  it("skips fetching shortcuts if the feature gate isn't enabled", async () => {
    jest.mocked(getFeatureGate).mockReturnValue(false)

    await expectSaga(fetchShortcutsSaga).run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("skips fetching shortcuts if they've already been fetched", async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchShortcutsSaga)
      .provide([[select(shortcutsStatusSelector), 'success']])
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('skips fetching shortcuts if no address is available in the store', async () => {
    jest.mocked(getFeatureGate).mockReturnValue(true)

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'idle'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(walletAddressSelector), null],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
      ])
      .not.put(fetchShortcutsSuccess(mockShortcuts))
      .run()

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('updates the shortcuts status there is an error', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })
    jest.mocked(getFeatureGate).mockReturnValue(true)
    jest.mocked(getDynamicConfigParams).mockReturnValue({ showShortcuts: ['celo-mainnet'] })

    await expectSaga(fetchShortcutsSaga)
      .provide([
        [select(shortcutsStatusSelector), 'idle'],
        [select(hooksPreviewApiUrlSelector), null],
        [select(hooksApiUrlSelector), networkConfig.hooksApiUrl],
        [select(walletAddressSelector), mockAccount],
      ])
      .put.actionType(fetchShortcutsFailure.type)
      .not.put(fetchShortcutsSuccess(expect.anything()))
      .run()

    expect(mockFetch).toHaveBeenCalled()
    expect(Logger.warn).toHaveBeenCalled()
  })
})

describe(handleEnableHooksPreviewDeepLink, () => {
  const deepLink = 'celo://wallet/hooks/enablePreview?hooksApiUrl=http%3A%2F%2F192.168.0.42%3A18000'

  it('enables hooks preview if the deep link is valid and the user confirms', async () => {
    Platform.OS = 'android'
    await expectSaga(handleEnableHooksPreviewDeepLink, deepLink, HooksEnablePreviewOrigin.Deeplink)
      .provide([[call(_confirmEnableHooksPreview), true]])
      .put(previewModeEnabled('http://192.168.0.42.sslip.io:18000/')) // Uses sslip.io for Android
      .run()
  })

  it('uses the direct IP on iOS if the deep link is valid and the user confirms', async () => {
    Platform.OS = 'ios'
    await expectSaga(handleEnableHooksPreviewDeepLink, deepLink, HooksEnablePreviewOrigin.Deeplink)
      .provide([[call(_confirmEnableHooksPreview), true]])
      .put(previewModeEnabled('http://192.168.0.42:18000'))
      .run()
  })

  it('does nothing if the deep link is invalid', async () => {
    await expectSaga(
      handleEnableHooksPreviewDeepLink,
      'invalid-link',
      HooksEnablePreviewOrigin.Deeplink
    )
      .provide([[call(_confirmEnableHooksPreview), true]])
      .not.put.actionType(previewModeEnabled.type)
      .run()
  })

  it("does nothing if the user doesn't confirm", async () => {
    await expectSaga(handleEnableHooksPreviewDeepLink, deepLink, HooksEnablePreviewOrigin.Deeplink)
      .provide([[call(_confirmEnableHooksPreview), false]])
      .not.put.actionType(previewModeEnabled.type)
      .run()
  })
})

describe(triggerShortcutSaga, () => {
  const shortcut = {
    id: 'someId',
    appName: 'some dapp name',
    appImage: 'https://some.image.url',
    data: {
      address: mockAccount,
      appId: 'gooddollar',
      networkId: NetworkId['celo-mainnet'],
      positionAddress: '0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1',
      shortcutId: 'claim-reward',
    },
  }

  it('should successfully trigger a shortcut and send the transaction', async () => {
    const mockTransaction = {
      network: 'celo',
      from: mockAccount,
      to: '0x43d72ff17701b2da814620735c39c620ce0ea4a1',
      data: '0x4e71d92d',
    }
    mockFetch.mockResponse(
      JSON.stringify({
        message: 'OK',
        data: {
          transactions: [mockTransaction],
        },
      })
    )

    await expectSaga(triggerShortcutSaga, triggerShortcut(shortcut))
      .provide([[select(hooksApiUrlSelector), networkConfig.hooksApiUrl]])
      .put(triggerShortcutSuccess({ id: 'someId', transactions: [mockTransaction] }))
      .not.put(triggerShortcutFailure(expect.anything()))
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.hooksApiUrl}/triggerShortcut`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shortcut.data),
      })
    )
  })

  it('should handle shortcut trigger failure', async () => {
    mockFetch.mockResponse(JSON.stringify({ message: 'something went wrong' }), { status: 500 })

    await expectSaga(triggerShortcutSaga, triggerShortcut(shortcut))
      .provide([[select(hooksApiUrlSelector), networkConfig.hooksApiUrl]])
      .not.put(triggerShortcutSuccess(expect.anything()))
      .put(triggerShortcutFailure('someId'))
      .run()

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      `${networkConfig.hooksApiUrl}/triggerShortcut`,
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shortcut.data),
      })
    )
  })
})

describe(executeShortcutSaga, () => {
  const mockTransaction = {
    network: 'celo',
    from: mockAccount,
    to: '0x43d72ff17701b2da814620735c39c620ce0ea4a1',
    data: '0x4e71d92d',
  }
  const defaultProviders: (EffectProviders | StaticProvider)[] = [
    [call(getContractKit), contractKit],
    [call(getConnectedUnlockedAccount), mockAccount],
    [
      select(triggeredShortcutsStatusSelector),
      {
        someId: {
          status: 'pendingAccept',
          transactions: [mockTransaction],
        },
      },
    ],
    [call(isBottomSheetVisible, Screens.DappShortcutTransactionRequest), true],
  ]

  it('should successfully trigger a shortcut and send the transaction', async () => {
    mockSendTransaction.mockResolvedValueOnce({ transactionHash: '0x1234' })

    await expectSaga(executeShortcutSaga, executeShortcut('someId'))
      .provide(defaultProviders)
      .put(executeShortcutSuccess('someId'))
      .not.put(executeShortcutFailure(expect.anything()))
      .run()

    expect(navigateBack).toHaveBeenCalled()
  })

  it('should handle shortcut trigger failure', async () => {
    mockSendTransaction.mockRejectedValueOnce('some error')

    await expectSaga(executeShortcutSaga, executeShortcut('someId'))
      .provide(defaultProviders)
      .not.put(executeShortcutSuccess(expect.anything()))
      .put(executeShortcutFailure('someId'))
      .put(showError(ErrorMessages.SHORTCUT_CLAIM_REWARD_FAILED))
      .run()

    expect(navigateBack).toHaveBeenCalled()
  })
})
