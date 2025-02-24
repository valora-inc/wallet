import Ajv from 'ajv'
import { spawn, takeEvery } from 'redux-saga/effects'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PerformanceEvents } from 'src/analytics/Events'
import { apiReducersKeys, ApiReducersKeys } from 'src/redux/apiReducersList'
import * as createMigrateModule from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import { RootState } from 'src/redux/reducers'
import { rootSaga } from 'src/redux/sagas'
import { _persistConfig, setupStore, timeBetweenStoreSizeEvents } from 'src/redux/store'
import * as accountCheckerModule from 'src/utils/accountChecker'
import Logger from 'src/utils/Logger'
import { getLatestSchema, vNeg1Schema } from 'test/schemas'

// Mock sagas because we don't want them to run in this test
jest.mock('src/redux/sagas', () => ({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  rootSaga: jest.fn(function* () {}),
}))
jest.unmock('redux-persist')

const originalCreateMigrate = jest.requireActual('src/redux/createMigrate').createMigrate

const createMigrate = jest.spyOn(createMigrateModule, 'createMigrate')
const resetStateOnInvalidStoredAccount = jest.spyOn(
  accountCheckerModule,
  'resetStateOnInvalidStoredAccount'
)

const loggerErrorSpy = jest.spyOn(Logger, 'error')

function getNonApiReducers<R = Omit<RootState, ApiReducersKeys>>(state: RootState): R {
  const nonApiReducers = {} as R

  for (const [key, value] of Object.entries(state)) {
    const isApiReducer = apiReducersKeys.includes(key)

    // api reducers are not persisted so skip them
    if (isApiReducer) continue

    nonApiReducers[key as keyof R] = value as unknown as any
  }

  return nonApiReducers
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  // For some reason createMigrate.mockRestore doesn't work, so instead we manually reset it to the original implementation
  createMigrate.mockImplementation(originalCreateMigrate)
  resetStateOnInvalidStoredAccount.mockImplementation((state) => Promise.resolve(state))
})

afterAll(() => {
  jest.useRealTimers()
})

describe('persistConfig', () => {
  it('points to the latest migration', () => {
    const migrationKeys = Object.keys(migrations)
      .map((ver) => parseInt(ver, 10))
      .sort((a, b) => a - b)

    // If this test fails, a migration has been added without increasing the persistConfig version
    expect(_persistConfig.version).toEqual(migrationKeys[migrationKeys.length - 1])
  })

  it('is in sync with the test schema', () => {
    // This is a good practice, we want to keep the test schema in sync with the migrations
    // so we can more easily test them
    expect(_persistConfig.version).toEqual(getLatestSchema()._persist?.version)
  })

  it('migrate calls the expected methods', async () => {
    createMigrate.mockReturnValue(() => Promise.resolve({ migrated: true }) as any)
    const state = await _persistConfig.migrate!({} as any, -1)
    expect(state).toEqual({ migrated: true })
    expect(createMigrate).toHaveBeenCalledTimes(1)
    expect(resetStateOnInvalidStoredAccount).toHaveBeenCalledTimes(1)
  })

  it('sends redux store size when available and after cooldown', () => {
    const dateNow = Date.now()
    jest.setSystemTime(dateNow)
    const serialize = _persistConfig?.serialize as unknown as (data: any) => string
    serialize({ _persist: true, foo: 'bar' })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    expect(AppAnalytics.track).toHaveBeenCalledWith(PerformanceEvents.redux_store_size, {
      size: 29,
    })
    // Should not track again until delay has passed
    serialize({ _persist: true, foo: 'bar' })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
    // Should track again after delay has passed
    jest.setSystemTime(new Date(dateNow + 2 * timeBetweenStoreSizeEvents).getTime())
    serialize({ _persist: true, foo: 'bar', bar: 'baz' })
    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
    expect(AppAnalytics.track).toHaveBeenCalledWith(PerformanceEvents.redux_store_size, {
      size: 41,
    })
  })
})

describe('store state', () => {
  // This test ensures the vNeg1Schema can be successfully migrated to the latest version
  // and validates against the latest RootState schema
  // See https://github.com/valora-inc/wallet/tree/main/WALLET.md#redux-state-migration
  it('validates against the RootState schema after rehydration', async () => {
    const { store, persistor } = setupStore(undefined, {
      ..._persistConfig,
      // @ts-ignore
      getStoredState: async () => {
        // Remove undefined values from the test state
        return JSON.parse(JSON.stringify(vNeg1Schema))
      },
    })

    // Wait for the persistor to have rehydrated the state
    await new Promise((resolve) => {
      persistor.subscribe(() => {
        const { bootstrapped } = persistor.getState()
        if (bootstrapped) {
          resolve(true)
        }
      })
    })

    const data = getNonApiReducers(store.getState())

    const ajv = new Ajv({ allErrors: true, allowUnionTypes: true })
    const schema = require('test/RootStateSchema.json')
    const validate = ajv.compile(schema)
    const isValid = validate(data)

    // console.log('Validation errors:', validate.errors?.length, validate.errors)
    expect(validate.errors).toBeNull()
    expect(isValid).toBe(true)

    // Make sure the state looks the way we expect it to.
    // This should help catch unintentional changes to the state, caused by incorrect migrations
    expect(data).toMatchInlineSnapshot(`
      {
        "_persist": {
          "rehydrated": true,
          "version": 244,
        },
        "account": {
          "acceptedTerms": false,
          "accountCreationTime": 99999999999999,
          "accountToRecoverFromStoreWipe": undefined,
          "backupCompleted": false,
          "celoEducationCompleted": false,
          "choseToRestoreAccount": false,
          "cloudBackupCompleted": false,
          "contactDetails": {
            "contactId": "contactId",
            "thumbnailPath": null,
          },
          "defaultCountryCode": "+1",
          "devModeActive": false,
          "devModeClickCount": 0,
          "dismissedGetVerified": false,
          "dismissedGoldEducation": false,
          "e164PhoneNumber": "+14155556666",
          "hasMigratedToNewBip39": false,
          "lastOnboardingStepScreen": "Welcome",
          "name": "John Doe",
          "onboardingCompleted": false,
          "photosNUXClicked": false,
          "pincodeType": "Unset",
          "profileUploaded": false,
          "recoveringFromStoreWipe": false,
          "recoveryPhraseInOnboardingStatus": "NotStarted",
          "startOnboardingTime": undefined,
        },
        "alert": null,
        "app": {
          "activeScreen": "Main",
          "analyticsEnabled": true,
          "appState": "Active",
          "divviRegistrations": {},
          "fiatConnectCashInEnabled": false,
          "fiatConnectCashOutEnabled": false,
          "googleMobileServicesAvailable": undefined,
          "hapticFeedbackEnabled": true,
          "hideBalances": false,
          "huaweiMobileServicesAvailable": undefined,
          "inAppReviewLastInteractionTimestamp": null,
          "inviterAddress": null,
          "lastTimeBackgrounded": 0,
          "locked": false,
          "pendingDeepLinks": [],
          "phoneNumberVerified": false,
          "pushNotificationRequestedUnixTime": 1692878055000,
          "pushNotificationsEnabled": false,
          "requirePinOnAppOpen": false,
          "sessionId": "",
          "showNotificationSpotlight": true,
          "supportedBiometryType": null,
        },
        "dapps": {
          "activeDapp": null,
          "dappsCategories": [],
          "dappsList": [],
          "dappsListError": null,
          "dappsListLoading": false,
          "favoriteDappIds": [],
          "mostPopularDappIds": [],
          "recentDappIds": [],
        },
        "earn": {
          "depositStatus": "idle",
          "poolInfo": undefined,
          "poolInfoFetchStatus": "idle",
          "withdrawStatus": "idle",
        },
        "fiatConnect": {
          "attemptReturnUserFlowLoading": false,
          "cachedFiatAccountUses": [],
          "cachedQuoteParams": {},
          "cachedTransfers": {},
          "kycTryAgainLoading": false,
          "personaInProgress": false,
          "providers": null,
          "quotes": [],
          "quotesError": null,
          "quotesLoading": false,
          "schemaCountryOverrides": {},
          "selectFiatConnectQuoteLoading": false,
          "sendingFiatAccountStatus": "NotSending",
          "transfer": null,
        },
        "fiatExchanges": {
          "providerLogos": {},
          "txHashToProvider": {},
        },
        "home": {
          "cleverTapInboxMessages": [],
          "hasVisitedHome": true,
          "loading": false,
          "nftCelebration": null,
          "notifications": {},
        },
        "i18n": {
          "language": "es-419",
          "otaTranslationsAppVersion": "0",
          "otaTranslationsLanguage": "",
          "otaTranslationsLastUpdate": 0,
        },
        "identity": {
          "addressToDisplayName": {},
          "addressToE164Number": {},
          "addressToVerificationStatus": {},
          "askedContactsPermission": false,
          "e164NumberToAddress": {},
          "importContactsProgress": {
            "current": 0,
            "status": 0,
            "total": 0,
          },
          "lastSavedContactsHash": null,
          "secureSendPhoneNumberMapping": {},
          "shouldRefreshStoredPasswordHash": true,
        },
        "imports": {
          "isImportingWallet": false,
        },
        "jumpstart": {
          "claimStatus": "idle",
          "depositStatus": "idle",
          "introHasBeenSeen": false,
          "reclaimStatus": "idle",
        },
        "keylessBackup": {
          "appKeyshare": null,
          "auth0IdToken": null,
          "backupStatus": "NotStarted",
          "deleteBackupStatus": "NotStarted",
          "showDeleteBackupError": false,
          "torusKeyshare": null,
        },
        "localCurrency": {
          "error": false,
          "fetchedCurrencyCode": "PHP",
          "isLoading": false,
          "preferredCurrencyCode": "PHP",
          "usdToLocalRate": "1.33",
        },
        "networkInfo": {
          "connected": false,
          "rehydrated": true,
          "userLocationData": {
            "countryCodeAlpha2": null,
            "ipAddress": null,
            "region": null,
          },
        },
        "nfts": {
          "nfts": [],
          "nftsError": null,
          "nftsLoading": false,
        },
        "points": {
          "getHistoryStatus": "idle",
          "introHasBeenDismissed": false,
          "nextPageUrl": null,
          "pendingPointsEvents": [],
          "pointsBalance": "0",
          "pointsBalanceStatus": "idle",
          "pointsConfig": {
            "activitiesById": {},
          },
          "pointsConfigStatus": "idle",
          "pointsHistory": [],
          "trackOnceActivities": {
            "create-wallet": false,
          },
        },
        "positions": {
          "earnPositionIds": [],
          "positions": [],
          "previewApiUrl": null,
          "shortcuts": [],
          "shortcutsStatus": "idle",
          "status": "idle",
          "triggeredShortcutsStatus": {},
        },
        "priceHistory": {},
        "recipients": {
          "appRecipientCache": {},
          "coinbasePaySenders": [],
          "inviteRewardsSenders": [],
          "phoneRecipientCache": {},
          "rewardsSenders": [],
        },
        "send": {
          "encryptedComment": null,
          "inviteRewardsVersion": "none",
          "isEncryptingComment": false,
          "isSending": false,
          "lastUsedTokenId": undefined,
          "recentPayments": [],
          "recentRecipients": [],
        },
        "swap": {
          "currentSwap": null,
          "lastSwapped": [],
        },
        "tokens": {
          "error": false,
          "tokenBalances": {},
        },
        "transactions": {
          "feedFirstPage": [],
          "standbyTransactions": [],
          "transactionsByNetworkId": {},
        },
        "walletConnect": {
          "pendingActions": [],
          "pendingSessions": [],
          "sessions": [],
        },
        "web3": {
          "account": "0x0000000000000000000000000000000000007E57",
          "demoModeEnabled": false,
        },
      }
    `)
  })
})

describe(setupStore, () => {
  it('reports uncaught errors happening in sagas', async () => {
    jest.mocked(rootSaga).mockImplementationOnce(function* () {
      yield spawn(function* mySaga() {
        yield takeEvery('SOME_ACTION', function* someActionHandler() {
          // do something
        })
        throw new Error('Just a test error')
      })
    })

    setupStore()

    expect(rootSaga).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy).toHaveBeenCalledTimes(1)
    expect(loggerErrorSpy.mock.calls[0]).toMatchInlineSnapshot(`
      [
        "redux/store",
        "Uncaught error in saga with stack: The above error occurred in task mySaga
      Tasks cancelled due to error:
      takeEvery(SOME_ACTION, someActionHandler)",
        [Error: Just a test error],
      ]
    `)
  })
})
