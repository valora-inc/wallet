import Ajv from 'ajv'
import { spawn, takeEvery } from 'redux-saga/effects'
import * as createMigrateModule from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import { rootSaga } from 'src/redux/sagas'
import { setupStore, _persistConfig } from 'src/redux/store'
import * as accountCheckerModule from 'src/utils/accountChecker'
import Logger from 'src/utils/Logger'
import { getLatestSchema, vNeg1Schema } from 'test/schemas'
import { mocked } from 'ts-jest/utils'

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

beforeEach(() => {
  jest.clearAllMocks()
  // For some reason createMigrate.mockRestore doesn't work, so instead we manually reset it to the original implementation
  createMigrate.mockImplementation(originalCreateMigrate)
  resetStateOnInvalidStoredAccount.mockImplementation((state) => Promise.resolve(state))
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

    const data = store.getState()

    const ajv = new Ajv({ allErrors: true })
    const schema = require('test/RootStateSchema.json')
    const validate = ajv.compile(schema)
    const isValid = validate(data)

    // console.log('Validation errors:', validate.errors?.length, validate.errors)
    expect(validate.errors).toBeNull()
    expect(isValid).toBe(true)

    // Make sure the state looks the way we expect it to.
    // This should help catch unintentional changes to the state, caused by incorrect migrations
    expect(data).toMatchInlineSnapshot(`
      Object {
        "_persist": Object {
          "rehydrated": true,
          "version": 119,
        },
        "account": Object {
          "acceptedTerms": false,
          "accountCreationTime": 99999999999999,
          "accountToRecoverFromStoreWipe": undefined,
          "backupCompleted": false,
          "backupRequiredTime": null,
          "celoEducationCompleted": false,
          "choseToRestoreAccount": false,
          "contactDetails": Object {
            "contactId": "contactId",
            "thumbnailPath": null,
          },
          "defaultCountryCode": "+1",
          "devModeActive": false,
          "devModeClickCount": 0,
          "dismissedGetVerified": false,
          "dismissedGoldEducation": false,
          "dismissedKeepSupercharging": false,
          "dismissedStartSupercharging": false,
          "e164PhoneNumber": "+14155556666",
          "hasMigratedToNewBip39": false,
          "name": "John Doe",
          "photosNUXClicked": false,
          "pictureUri": null,
          "pincodeType": "Unset",
          "profileUploaded": false,
          "recoveringFromStoreWipe": false,
          "startOnboardingTime": undefined,
        },
        "alert": null,
        "app": Object {
          "activeScreen": "Main",
          "analyticsEnabled": true,
          "appState": "Active",
          "celoEducationUri": null,
          "celoEuroEnabled": true,
          "celoNews": Object {
            "enabled": false,
          },
          "coinbasePayEnabled": false,
          "fiatConnectCashInEnabled": false,
          "fiatConnectCashOutEnabled": false,
          "googleMobileServicesAvailable": undefined,
          "hapticFeedbackEnabled": true,
          "huaweiMobileServicesAvailable": undefined,
          "inviterAddress": null,
          "lastTimeBackgrounded": 0,
          "locked": false,
          "logPhoneNumberTypeEnabled": false,
          "loggedIn": false,
          "maxSwapSlippagePercentage": 2,
          "minVersion": null,
          "networkTimeoutSeconds": 30,
          "numberVerified": false,
          "paymentDeepLinkHandler": "",
          "phoneNumberVerified": false,
          "pincodeUseExpandedBlocklist": false,
          "rampCashInButtonExpEnabled": false,
          "requireCPV": false,
          "requirePinOnAppOpen": false,
          "rewardPillText": Object {
            "de": "Belohnungen",
            "en": "Rewards",
            "es": "Recompensas",
            "pt": "Recompensas",
          },
          "sentryNetworkErrors": Array [
            "network request failed",
            "The network connection was lost",
          ],
          "sentryTracesSampleRate": 0.2,
          "sessionId": "",
          "shouldShowRecoveryPhraseInSettings": false,
          "showPriceChangeIndicatorInBalances": false,
          "showSwapMenuInDrawerMenu": false,
          "skipVerification": false,
          "superchargeApy": 12,
          "superchargeTokenConfigByToken": Object {},
          "supportedBiometryType": null,
          "visualizeNFTsEnabledInHomeAssetsPage": false,
          "walletConnectV1Enabled": true,
          "walletConnectV2Enabled": true,
        },
        "dapps": Object {
          "activeDapp": null,
          "dappConnectInfo": "default",
          "dappFavoritesEnabled": false,
          "dappListApiUrl": null,
          "dappsCategories": Array [],
          "dappsFilterEnabled": false,
          "dappsList": Array [],
          "dappsListError": null,
          "dappsListLoading": false,
          "dappsMinimalDisclaimerEnabled": false,
          "dappsSearchEnabled": false,
          "dappsWebViewEnabled": false,
          "favoriteDappIds": Array [],
          "maxNumRecentDapps": 0,
          "recentDappIds": Array [],
        },
        "escrow": Object {
          "isReclaiming": false,
          "sentEscrowedPayments": Array [],
        },
        "exchange": Object {
          "exchangeRates": null,
          "history": Object {
            "aggregatedExchangeRates": Array [],
            "celoGoldExchangeRates": Array [],
            "granularity": 60,
            "lastTimeUpdated": 0,
            "range": 2592000000,
          },
          "isLoading": false,
          "tobinTax": "0",
        },
        "fees": Object {
          "estimates": Object {},
        },
        "fiatConnect": Object {
          "attemptReturnUserFlowLoading": false,
          "cachedFiatAccountUses": Array [],
          "cachedQuoteParams": Object {},
          "cachedTransfers": Object {},
          "kycTryAgainLoading": false,
          "personaInProgress": false,
          "providers": null,
          "quotes": Array [],
          "quotesError": null,
          "quotesLoading": false,
          "schemaCountryOverrides": Object {},
          "selectFiatConnectQuoteLoading": false,
          "sendingFiatAccountStatus": "NotSending",
          "transfer": null,
        },
        "fiatExchanges": Object {
          "providerLogos": Object {},
          "txHashToProvider": Object {},
        },
        "home": Object {
          "loading": false,
          "notifications": Object {},
        },
        "i18n": Object {
          "allowOtaTranslations": false,
          "language": "es-419",
          "otaTranslationsAppVersion": "0",
          "otaTranslationsLanguage": "",
          "otaTranslationsLastUpdate": 0,
        },
        "identity": Object {
          "addressToDataEncryptionKey": Object {},
          "addressToDisplayName": Object {},
          "addressToE164Number": Object {},
          "askedContactsPermission": false,
          "e164NumberToAddress": Object {},
          "e164NumberToSalt": Object {},
          "hasSeenVerificationNux": false,
          "importContactsProgress": Object {
            "current": 0,
            "status": 0,
            "total": 0,
          },
          "secureSendPhoneNumberMapping": Object {},
          "walletToAccountAddress": Object {},
        },
        "imports": Object {
          "isImportingWallet": false,
        },
        "localCurrency": Object {
          "error": false,
          "exchangeRates": Object {
            "cEUR": null,
            "cGLD": null,
            "cUSD": "1.33",
          },
          "fetchedCurrencyCode": "PHP",
          "isLoading": false,
          "preferredCurrencyCode": "PHP",
        },
        "networkInfo": Object {
          "connected": false,
          "rehydrated": true,
          "userLocationData": Object {
            "countryCodeAlpha2": null,
            "ipAddress": null,
            "region": null,
          },
        },
        "paymentRequest": Object {
          "incomingPaymentRequests": Array [],
          "outgoingPaymentRequests": Array [],
        },
        "recipients": Object {
          "coinbasePaySenders": Array [],
          "inviteRewardsSenders": Array [],
          "phoneRecipientCache": Object {},
          "rewardsSenders": Array [],
          "valoraRecipientCache": Object {},
        },
        "send": Object {
          "inviteRewardCusd": 5,
          "inviteRewardWeeklyLimit": 20,
          "inviteRewardsVersion": "none",
          "isSending": false,
          "lastUsedCurrency": "cUSD",
          "recentPayments": Array [],
          "recentRecipients": Array [],
          "showSendToAddressWarning": true,
        },
        "supercharge": Object {
          "availableRewards": Array [],
          "error": false,
          "fetchAvailableRewardsError": false,
          "fetchAvailableRewardsLoading": false,
          "loading": false,
          "superchargeRewardContractAddress": "",
          "superchargeV1Addresses": Array [],
          "superchargeV2Enabled": false,
        },
        "swap": Object {
          "guaranteedSwapPriceEnabled": false,
          "swapInfo": null,
          "swapState": "quote",
          "swapUserInput": null,
        },
        "tokens": Object {
          "error": false,
          "loading": false,
          "tokenBalances": Object {},
        },
        "transactions": Object {
          "inviteTransactions": Object {},
          "knownFeedTransactions": Object {},
          "recentTxRecipientsCache": Object {},
          "standbyTransactions": Array [],
          "standbyTransactionsLegacy": Array [],
          "transactions": Array [],
        },
        "walletConnect": Object {
          "v1": Object {
            "pendingActions": Array [],
            "pendingSessions": Array [],
            "sessions": Array [],
          },
          "v2": Object {
            "pendingActions": Array [],
            "pendingSessions": Array [],
            "sessions": Array [],
          },
        },
        "web3": Object {
          "account": "0x0000000000000000000000000000000000007E57",
          "accountInWeb3Keystore": "0x0000000000000000000000000000000000007E57",
          "dataEncryptionKey": "0x0000000000000000000000000000000000008F68",
          "isDekRegistered": false,
          "mtwAddress": null,
          "twelveWordMnemonicEnabled": false,
        },
      }
    `)
  })
})

describe(setupStore, () => {
  it('reports uncaught errors happening in sagas', async () => {
    mocked(rootSaga).mockImplementationOnce(function* () {
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
      Array [
        "redux/store",
        "Uncaught error in saga with stack: The above error occurred in task mySaga
      Tasks cancelled due to error:
      takeEvery(SOME_ACTION, someActionHandler)",
        [Error: Just a test error],
      ]
    `)
  })
})
