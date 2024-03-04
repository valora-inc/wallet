import BigNumber from 'bignumber.js'
import _ from 'lodash'
import { FinclusiveKycStatus } from 'src/account/reducer'
import { initialState as exchangeInitialState } from 'src/exchange/reducer'
import { migrations } from 'src/redux/migrations'
import {
  Network,
  NetworkId,
  TokenTransactionTypeV2,
  TransactionStatus,
} from 'src/transactions/types'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import {
  DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY,
  v0Schema,
  v103Schema,
  v104Schema,
  v106Schema,
  v112Schema,
  v115Schema,
  v124Schema,
  v125Schema,
  v130Schema,
  v132Schema,
  v133Schema,
  v136Schema,
  v13Schema,
  v144Schema,
  v145Schema,
  v146Schema,
  v148Schema,
  v14Schema,
  v159Schema,
  v15Schema,
  v164Schema,
  v166Schema,
  v167Schema,
  v16Schema,
  v171Schema,
  v172Schema,
  v174Schema,
  v176Schema,
  v177Schema,
  v178Schema,
  v179Schema,
  v17Schema,
  v18Schema,
  v197Schema,
  v1Schema,
  v21Schema,
  v28Schema,
  v2Schema,
  v35Schema,
  v36Schema,
  v37Schema,
  v41Schema,
  v43Schema,
  v45Schema,
  v46Schema,
  v49Schema,
  v50Schema,
  v51Schema,
  v52Schema,
  v53Schema,
  v56Schema,
  v57Schema,
  v58Schema,
  v59Schema,
  v62Schema,
  v75Schema,
  v7Schema,
  v81Schema,
  v84Schema,
  v8Schema,
  v98Schema,
  v99Schema,
  vNeg1Schema,
} from 'test/schemas'
import {
  mockInvitableRecipient,
  mockInvitableRecipient2,
  mockRecipient,
  mockRecipient2,
} from 'test/values'

describe('Redux persist migrations', () => {
  it('works for v-1 to v0', () => {
    const mockNumber = '+111111111111'
    const mockAddress = '0x00000000000000000000'
    const vNeg1Stub = {
      ...vNeg1Schema,
      identity: {
        ...vNeg1Schema.identity,
        e164NumberToAddress: { [mockNumber]: mockAddress },
      },
    }
    const migratedSchema = migrations[0](vNeg1Stub)
    expect(migratedSchema.identity.e164NumberToAddress).toEqual({ [mockNumber]: [mockAddress] })
  })

  it('works for v0 to v1', () => {
    const mockNumber = '+111111111111'
    const mockAddress = '0x00000000000000000000'
    const v0Stub = {
      ...v0Schema,
      invite: {
        ...v0Schema.invite,
        invitees: {
          [mockAddress]: mockNumber,
        },
      },
    }
    const migratedSchema = migrations[1](v0Stub)
    expect(migratedSchema.invite.invitees[0].tempWalletAddress).toEqual(mockAddress)
  })

  it('works for v1 to v2', () => {
    const v1Stub = {
      ...v1Schema,
      app: {
        ...v1Schema.app,
        numberVerified: true,
      },
    }
    const migratedSchema = migrations[2](v1Stub)
    expect(migratedSchema.app.numberVerified).toEqual(false)
  })

  it('works for v2 to v3', () => {
    const v2Stub = {
      ...v2Schema,
      send: {
        ...v2Schema.send,
        recentPayments: [{ timestamp: Date.now(), amount: '100' }],
      },
      account: {
        ...v2Schema.account,
        hasMigratedToNewBip39: false,
      },
    }
    const migratedSchema = migrations[3](v2Stub)
    expect(migratedSchema.send.recentPayments.length).toEqual(0)
  })

  it('works for v3 to v4', () => {
    const v3Stub = {
      ...v2Schema,
      identity: {
        ...v2Schema.identity,
        acceptedAttestationCodes: [{ code: 'code', issuer: 'issuer' }],
      },
    }
    const migratedSchema = migrations[4](v3Stub)
    expect(migratedSchema.identity.acceptedAttestationCodes.length).toEqual(0)
  })

  it('works for v4 to v5', () => {
    const v4Stub = {
      account: {
        incomingPaymentRequests: [1, 2, 3],
        outgoingPaymentRequests: [],
      },
      web3: {
        commentKey: 'key',
      },
    }
    const migratedSchema = migrations[5](v4Stub)
    expect(migratedSchema.paymentRequest.incomingPaymentRequests).toMatchObject([1, 2, 3])
    expect(migratedSchema.paymentRequest.outgoingPaymentRequests).toMatchObject([])
    expect(migratedSchema.account.incomingPaymentRequests).toBe(undefined)
    expect(migratedSchema.account.outgoingPaymentRequests).toBe(undefined)
    expect(migratedSchema.web3.dataEncryptionKey).toBe('key')
    expect(migratedSchema.web3.commentKey).toBe(undefined)
  })

  it('works for v5 to v6', () => {
    const v5Stub = {
      invite: {
        redeemComplete: false,
      },
      web3: {
        account: 'some_account',
      },
    }
    const migratedSchema = migrations[6](v5Stub)
    expect(migratedSchema.invite.redeemComplete).toBe(true)
  })

  it('works for v6 to v7', () => {
    const mockAddress = '0x00000000000000000000'
    const mockName = 'Mock Name'

    const v6Stub = {
      identity: {
        addressToDisplayName: {
          [mockAddress]: mockName,
        },
      },
    }
    const migratedSchema = migrations[7](v6Stub)
    expect(Object.keys(migratedSchema.identity.addressToDisplayName).length).toEqual(1)
    expect(migratedSchema.identity.addressToDisplayName[mockAddress].name).toEqual(mockName)
    expect(migratedSchema.identity.addressToDisplayName[mockAddress].imageUrl).toBeNull()
  })

  it('works for v7 to v8', () => {
    const txHash = '0x00000000000000000000'
    const mockName = 'Mock Name'
    const mockIcon = 'Mock icon'

    const v7Stub = {
      fiatExchanges: {
        txHashToProvider: {
          [txHash]: {
            name: mockName,
            icon: mockIcon,
          },
        },
        lastUsedProvider: {
          name: 'Simplex',
          icon: mockIcon,
        },
      },
    }
    const migratedSchema = migrations[8](v7Stub)
    expect(Object.keys(migratedSchema.fiatExchanges.txHashToProvider).length).toEqual(1)
    expect(migratedSchema.fiatExchanges.txHashToProvider[txHash].name).toEqual(mockName)
    expect(migratedSchema.fiatExchanges.txHashToProvider[txHash].icon).toEqual(mockIcon)
    expect(migratedSchema.fiatExchanges.lastUsedProvider).toEqual('Simplex')
  })

  it('works for v8 to v9', () => {
    const v8Stub = {
      account: {
        dailyLimitCusd: 500,
      },
    }
    const migratedSchema = migrations[9](v8Stub)
    expect(migratedSchema.account.dailyLimitCusd).toEqual(DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY)
  })
  it('works for v9 to v10', () => {
    const v9Stub = v7Schema
    const migratedSchema = migrations[10](v9Stub)
    expect(migratedSchema.identity.feelessAttestationCodes).toBeUndefined()
    expect(migratedSchema.identity.feelessProcessingInputCode).toBeUndefined()
    expect(migratedSchema.identity.feelessAcceptedAttestationCodes).toBeUndefined()
    expect(migratedSchema.identity.feelessNumCompleteAttestations).toBeUndefined()
    expect(migratedSchema.identity.feelessVerificationStatus).toBeUndefined()
    expect(migratedSchema.identity.verificationState).toBeUndefined()
    expect(migratedSchema.identity.feelessVerificationState).toBeUndefined()
    expect(migratedSchema.identity.feelessLastRevealAttempt).toBeUndefined()
  })
  it('works for v10 to v11', () => {
    const migratedSchema = migrations[11](v8Schema)
    expect(migratedSchema.app.pontoEnabled).toBeUndefined()
    expect(migratedSchema.app.kotaniEnabled).toBeUndefined()
    expect(migratedSchema.app.bitfyUrl).toBeUndefined()
    expect(migratedSchema.app.flowBtcUrl).toBeUndefined()
  })
  it('works for v11 to v12', () => {
    const appStub = 'dont delete please'
    const exchangeStub = 'also dont delete please'
    const stub = {
      exchange: {
        otherExchangeProps: exchangeStub,
        history: {
          celoGoldExchangeRates: [1, 2, 3],
          aggregatedExchangeRates: [4, 5, 6],
          granularity: 0,
          range: 0,
          lastTimeUpdated: 100,
        },
      },
      app: appStub,
    }
    const migratedSchema = migrations[12](stub)
    expect(migratedSchema.app).toEqual(appStub)
    expect(migratedSchema.exchange.otherExchangeProps).toEqual(exchangeStub)
    expect(migratedSchema.exchange.history).toEqual(exchangeInitialState.history)
  })
  it('works for v12 to v13', () => {
    const stub = {
      verify: {
        existingProperty: 'verify_existingProperty',
        TEMPORARY_override_withoutVerification: 'oldValue',
        withoutRevealing: true,
        retries: 3,
      },
      identity: {
        existingProperty: 'identity_existingProperty',
        hasSeenVerificationNux: true,
        attestationCodes: ['code1', 'code2'],
        acceptedAttestationCodes: ['code1'],
        attestationInputStatus: ['loading'],
        numCompleteAttestations: 3,
        verificationStatus: 'verified',
        lastRevealAttempt: 'yesterday',
      },
    }
    const migratedSchema = migrations[13](stub)
    expect(migratedSchema.verify.existingProperty).toEqual('verify_existingProperty')
    expect(migratedSchema.identity.existingProperty).toEqual('identity_existingProperty')
    expect(migratedSchema.verify.seenVerificationNux).toEqual(true)
    const deletedIdentityProperties = [
      'attestationCodes',
      'acceptedAttestationCodes',
      'attestationInputStatus',
      'numCompleteAttestations',
      'verificationStatus',
      'lastRevealAttempt',
    ]
    for (const deletedProperty of deletedIdentityProperties) {
      expect(Object.keys(migratedSchema.identity).includes(deletedProperty)).toEqual(false)
    }
    const deletedVerifyProperties = [
      'TEMPORARY_override_withoutVerification',
      'withoutRevealing',
      'retries',
    ]
    for (const deletedProperty of deletedVerifyProperties) {
      expect(Object.keys(migratedSchema.verify).includes(deletedProperty)).toEqual(false)
    }
  })

  it('works for v13 to v14', () => {
    const migratedSchema = migrations[14](v13Schema)
    expect(migratedSchema.networkInfo.userLocationData).toBeDefined()
    expect(migratedSchema.networkInfo.userLocationData.countryCodeAlpha2).toEqual(null)
  })

  it('works for v14 to v15', () => {
    const v14Stub = {
      ...v14Schema,
      verify: {
        ...v14Schema.verify,
        seenVerificationNux: true,
      },
    }
    const migratedSchema = migrations[15](v14Stub)
    expect(migratedSchema.identity.hasSeenVerificationNux).toEqual(true)
    expect(migratedSchema.identity).toMatchInlineSnapshot(`
      {
        "acceptedAttestationCodes": [],
        "addressToDataEncryptionKey": {},
        "addressToDisplayName": {},
        "addressToE164Number": {},
        "askedContactsPermission": false,
        "attestationInputStatus": [
          "Inputting",
          "Disabled",
          "Disabled",
        ],
        "attestationsCode": [],
        "contactMappingProgress": {
          "current": 0,
          "total": 0,
        },
        "e164NumberToAddress": {},
        "e164NumberToSalt": {},
        "hasSeenVerificationNux": true,
        "importContactsProgress": {
          "current": 0,
          "status": 0,
          "total": 0,
        },
        "isLoadingImportContacts": false,
        "lastRevealAttempt": null,
        "matchedContacts": {},
        "numCompleteAttestations": 0,
        "secureSendPhoneNumberMapping": {},
        "startedVerification": false,
        "verificationFailed": false,
        "verificationStatus": 0,
        "walletToAccountAddress": {},
      }
    `)
    expect(migratedSchema.verify).toMatchInlineSnapshot(`
      {
        "TEMPORARY_override_withoutVerification": undefined,
        "actionableAttestations": [],
        "currentState": {
          "type": "Idle",
        },
        "komenci": {
          "callbackUrl": undefined,
          "captchaToken": "",
          "errorTimestamps": [],
          "sessionActive": false,
          "sessionToken": "",
          "unverifiedMtwAddress": null,
        },
        "komenciAvailable": "UNKNOWN",
        "retries": 0,
        "status": {
          "completed": 0,
          "isVerified": false,
          "komenci": true,
          "numAttestationsRemaining": 3,
          "total": 0,
        },
        "withoutRevealing": false,
      }
    `)
  })
  it('works for v15 to v16', () => {
    const migratedSchema = migrations[16]({
      ...v15Schema,
      stableToken: {
        ...v15Schema.stableToken,
        balance: '150',
      },
      escrow: {
        isReclaiming: true,
        sentEscrowedPayments: [{ object: 'with keys' }],
      },
    })
    expect(migratedSchema.localCurrency.exchangeRates).toBeDefined()
    expect(migratedSchema.localCurrency.exchangeRates[Currency.Dollar]).toEqual(
      v15Schema.localCurrency.exchangeRate
    )
    expect(migratedSchema.stableToken.balance).toBeUndefined()
    expect(migratedSchema.stableToken.balances[Currency.Dollar]).toEqual('150')
    expect(migratedSchema.escrow.isReclaiming).toBeFalsy()
    expect(migratedSchema.escrow.sentEscrowedPayments.length).toEqual(0)
  })
  it('works for v16 to v17', () => {
    const migratedSchema = migrations[17](v16Schema)
    expect(migratedSchema.fiatExchanges.lastUsedProvider).not.toBeDefined()
  })
  it('works for v17 to v18', () => {
    expect(v17Schema.walletConnect.pairings).toBeDefined()
    const migratedSchema = migrations[18](v17Schema)
    expect(migratedSchema.walletConnect.v2.pairings).not.toBeDefined()
  })
  it('works for v18 to v19', () => {
    // Test normal case
    const migratedSchema = migrations[19](v18Schema)
    // No changes expected
    expect(migratedSchema).toBe(v18Schema)

    // Test incorrect migrated state from v18 where v2 became an empty object
    // if state.walletConnect was previously undefined
    const v18Stub = {
      ...v18Schema,
      walletConnect: {
        ...v18Schema.walletConnect,
        v2: {},
      },
    }
    const migratedSchema2 = migrations[19](v18Stub)
    expect(migratedSchema2.walletConnect.v1).toBe(v18Schema.walletConnect.v1)
    expect(migratedSchema2.walletConnect.v2).toBeUndefined()
  })
  it('works for v21 to v22', () => {
    const migratedSchema = migrations[22](v21Schema)

    expect(migratedSchema.i18n).toEqual({
      language: 'es-419',
      allowOtaTranslations: false,
      otaTranslationsLastUpdate: 0,
      otaTranslationsAppVersion: '0',
      otaTranslationsLanguage: '',
    })
    expect(migratedSchema.app.language).toBe(undefined)
  })

  it('works for v28 to v29', () => {
    expect(v28Schema.web3.fornoMode).toBe(false)
    const migratedSchema = migrations[29](v28Schema)

    expect(migratedSchema.web3.fornoMode).toBe(true)
    expect(migratedSchema.web3.hadFornoDisabled).toBe(true)
  })
  it('works for v35 to v36', () => {
    const oldSchema = v35Schema
    const migratedSchema = migrations[36](oldSchema)

    const expectedSchema: any = { ...oldSchema }
    expectedSchema.account.finclusiveKycStatus = FinclusiveKycStatus.NotSubmitted
    expectedSchema.app.maxNumRecentDapps = 0
    expectedSchema.app.recentDapps = []

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v36 to v37', () => {
    const oldSchema = v36Schema
    const migratedSchema = migrations[37](oldSchema)

    const expectedSchema: any = { ...oldSchema }
    expectedSchema.app.showPriceChangeIndicatorInBalances = false

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v37 to v38', () => {
    const oldSchema = v37Schema
    const migratedSchema = migrations[38](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.skipVerification = false

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v41 to v42', () => {
    const oldSchema = v41Schema
    const migratedSchema = migrations[42](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.skipProfilePicture = false

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v43 to v44', () => {
    const oldSchema = v43Schema
    const migratedSchema = migrations[44](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.account.finclusiveRegionSupported = false
    expectedSchema.app.finclusiveUnsupportedStates = ['NY', 'TX']

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v45 to v46', () => {
    const migratedSchema = migrations[46](v45Schema)

    const expectedSchema: any = _.cloneDeep(v45Schema)
    expectedSchema.cloudFunctionsApi = undefined

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v46 to v47', () => {
    const migratedSchema = migrations[47](v46Schema)

    const expectedSchema: any = _.cloneDeep(v46Schema)
    delete expectedSchema.app.multiTokenUseSendFlow
    delete expectedSchema.app.multiTokenUseUpdatedFeed
    delete expectedSchema.app.multiTokenShowHomeBalances

    expect(migratedSchema).toMatchObject(expectedSchema)
  })
  it('works for v49 to v50', () => {
    const migratedSchema = migrations[50](v49Schema)

    const expectedSchema: any = _.cloneDeep(v49Schema)
    delete expectedSchema.app.walletConnectV2Enabled
    delete expectedSchema.walletConnect.v2

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v50 to v51', () => {
    const oldSchema = v50Schema
    const migratedSchema = migrations[51](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.celoWithdrawalEnabledInExchange = true

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v51 to v52', () => {
    const oldSchema = v51Schema
    const migratedSchema = migrations[52](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.fiatConnectCashInEnabled = false
    expectedSchema.app.fiatConnectCashOutEnabled = false

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v52 to v53', () => {
    const oldSchema = v52Schema
    const migratedSchema = migrations[53](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.geth
    delete expectedSchema.account.promptFornoIfNeeded
    delete expectedSchema.account.retryVerificationWithForno
    delete expectedSchema.web3.fornoMode
    delete expectedSchema.web3.hadFornoDisabled
    delete expectedSchema.web3.latestBlockNumber
    delete expectedSchema.web3.syncProgress

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v53 to v54', () => {
    const dapp = {
      name: 'Ubeswap',
      description: 'Swap any token, enter a pool, or farm your crypto',
      dappUrl: 'https://app.ubeswap.org/',
      categoryId: 'exchanges',
      iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
      isFeatured: false,
      id: 'ubeswap',
    }
    const dappsInfo = {
      dappsWebViewEnabled: true,
      activeDapp: dapp,
      maxNumRecentDapps: 8,
      recentDapps: [dapp],
      dappListApiUrl: 'https://www.dapplist.com',
    }

    const oldSchema = {
      ...v53Schema,
      app: {
        ...v53Schema.app,
        ...dappsInfo,
      },
    }
    const migratedSchema = migrations[54](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.app.dappsWebViewEnabled
    delete expectedSchema.app.activeDapp
    delete expectedSchema.app.maxNumRecentDapps
    delete expectedSchema.app.recentDapps
    delete expectedSchema.app.dappListApiUrl
    expectedSchema.dapps = dappsInfo

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v56 to v57', () => {
    const oldSchema = v56Schema
    const migratedSchema = migrations[57](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.visualizeNFTsEnabledInHomeAssetsPage = false

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v57 to v58', () => {
    const oldSchema = v57Schema
    const migratedSchema = migrations[58](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.coinbasePayEnabled = false

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v58 to v59', () => {
    const oldTransactions = [
      {
        metadata: {
          title: null,
          comment: '',
          subtitle: null,
          image: null,
        },
        __typename: 'TokenTransferV2',
        block: '14255636',
        transactionHash: '0xf4e59db43c9051947ffe8a29a09c8f85dcf540699855166aa68f11cda3014b72',
        type: 'RECEIVED',
        amount: {
          value: '0.01',
          tokenAddress: '0x765de816845861e75a25fca122bb6898b8b1282a',
          localAmount: {
            currencyCode: 'USD',
            exchangeRate: '1',
            value: '0.01',
          },
        },
        fees: null,
        timestamp: 1658945996000,
        address: '0xde33e71faecdead20e6a8af8f362d2236cba005f',
      },
      {},
    ]
    const oldSchema = {
      ...v58Schema,
      transactions: {
        ...v58Schema.transactions,
        transactions: oldTransactions,
      },
    }
    const migratedSchema = migrations[59](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.transactions.transactions = [oldTransactions[0]]

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v59 to v60', () => {
    const oldSchema = v59Schema
    const migratedSchema = migrations[60](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.fiatConnect = {}
    expectedSchema.fiatConnect.quotes = []
    expectedSchema.fiatConnect.quotesLoading = false
    expectedSchema.fiatConnect.quotesError = null

    expect(migratedSchema).toMatchObject(expectedSchema)
  })

  it('works for v62 to v63', () => {
    const oldSchema = v62Schema
    const migratedSchema = migrations[63](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.superchargeTokenConfigByToken = {}
    delete expectedSchema.app.superchargeTokens

    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works for v75 to v76', () => {
    const oldSchema = v75Schema
    const migratedSchema = migrations[76](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.showGuidedOnboardingCopy = false
    // shall be the default value as configured in REMOTE_CONFIG_VALUES_DEFAULTS
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v81 to v82', () => {
    const oldSchema = v81Schema
    const migratedSchema = migrations[82](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.swap = {
      swapState: 'quote',
      swapInfo: null,
      swapUserInput: null,
    }

    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v84 to v85', () => {
    const oldSchema = v84Schema
    const migratedSchema = migrations[85](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.app.swapFeeEnabled
    delete expectedSchema.app.swapFeePercentage
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v98 to v99', () => {
    const oldSchema = {
      ...v98Schema,
      dapps: {
        ...v98Schema.dapps,
        recentDapps: [
          {
            name: 'Ubeswap',
            description: 'Swap any token, enter a pool, or farm your crypto',
            dappUrl: 'https://app.ubeswap.org/',
            categoryId: 'exchanges',
            iconUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
            isFeatured: false,
            id: 'ubeswap',
          },
        ],
        favoriteDapps: [
          {
            name: 'Moola',
            description: 'Lend, borrow, or add to a pool to earn rewards',
            dappUrl: 'celo://wallet/moolaScreen',
            categoryId: 'lend',
            iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/moola.png',
            isFeatured: false,
            id: 'moola',
          },
        ],
      },
    }
    const migratedSchema = migrations[99](oldSchema)

    const expectedSchema: any = {
      ...v98Schema,
      dapps: {
        ...v98Schema.dapps,
        recentDappIds: ['ubeswap'],
        favoriteDappIds: ['moola'],
      },
    }
    delete expectedSchema.dapps.recentDapps
    delete expectedSchema.dapps.favoriteDapps
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v99 to v100', () => {
    const oldSchema = v99Schema
    const migratedSchema = migrations[100](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.app.celoNewsEnabled

    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v103 to v104', () => {
    const oldSchema = v103Schema
    const migratedSchema = migrations[104](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.goldToken
    delete expectedSchema.stableToken
    expectedSchema.account.celoEducationCompleted = oldSchema.goldToken.educationCompleted

    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v104 to v105', () => {
    const oldSchema = v104Schema
    const migratedSchema = migrations[105](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.web3.twelveWordMnemonicEnabled = false
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v106 to v107', () => {
    const oldSchema = {
      ...v106Schema,
      fiatConnect: {
        ...v106Schema.fiatConnect,
        cachedFiatAccountUses: [
          {
            providerId: 'provider-two',
            cryptoType: Currency.Dollar,
          },
          {
            providerId: 'provider-one',
            cryptoType: Currency.Celo,
          },
        ],
        cachedQuoteParams: {
          'some-provider': {
            ['some-schema']: {
              cryptoAmount: '10',
              fiatAmount: '10',
              cryptoType: Currency.Dollar,
            },
          },
          'some-other-provider': {
            ['some-schema']: {
              cryptoAmount: '10',
              fiatAmount: '10',
              cryptoType: Currency.Celo,
            },
          },
        },
      },
    }
    const migratedSchema = migrations[107](oldSchema)

    const freshSchema: any = _.cloneDeep(oldSchema)
    const expectedSchema = {
      ...freshSchema,
      fiatConnect: {
        ...freshSchema.fiatConnect,
        cachedFiatAccountUses: [
          {
            providerId: 'provider-two',
            cryptoType: CiCoCurrency.cUSD,
          },
          {
            providerId: 'provider-one',
            cryptoType: CiCoCurrency.CELO,
          },
        ],
        cachedQuoteParams: {
          'some-provider': {
            ['some-schema']: {
              cryptoAmount: '10',
              fiatAmount: '10',
              cryptoType: CiCoCurrency.cUSD,
            },
          },
          'some-other-provider': {
            ['some-schema']: {
              cryptoAmount: '10',
              fiatAmount: '10',
              cryptoType: CiCoCurrency.CELO,
            },
          },
        },
      },
    }
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })
  it('works from v112 to v113', () => {
    const oldSchema = v112Schema
    const migratedSchema = migrations[113](oldSchema)

    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.app.skipProfilePicture
    delete expectedSchema.app.showGuidedOnboardingCopy
    delete expectedSchema.app.createAccountCopyTestType

    expect(migratedSchema).toStrictEqual(expectedSchema)
  })
  it('works from v115 to v116', () => {
    const oldSchema = v115Schema
    const migratedSchema = migrations[116](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.account.startOnboardingTime = undefined
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v124 to v125', () => {
    const oldSchema = v124Schema
    const migratedSchema = migrations[125](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.app.celoNews.enabled
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v125 to v126', () => {
    const oldSchmea = v125Schema
    const migratedSchema = migrations[126](oldSchmea)
    const expectedSchema: any = _.cloneDeep(oldSchmea)
    expectedSchema.app.inAppReviewLastInteractionTimestamp = null
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v130 to v131', () => {
    const oldSchemaWithV1Dapp = {
      ...v130Schema,
      dapps: {
        ...v130Schema.dapps,
        dappsList: [
          {
            name: 'Ubeswap',
            description: 'Swap any token, enter a pool, or farm your crypto',
            dappUrl: 'https://app.ubeswap.org/',
            categoryId: 'exchanges',
            iconUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
            isFeatured: false,
            id: 'ubeswap',
          },
        ],
        activeDapp: {
          name: 'Ubeswap',
          description: 'Swap any token, enter a pool, or farm your crypto',
          dappUrl: 'https://app.ubeswap.org/',
          categoryId: 'exchanges',
          iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
          isFeatured: false,
          id: 'ubeswap',
          openedFrom: 'featured',
        },
      },
    }
    const expectedSchemaWithV2Dapp: any = {
      ...v130Schema,
      dapps: {
        ...v130Schema.dapps,
        dappsList: [
          {
            name: 'Ubeswap',
            description: 'Swap any token, enter a pool, or farm your crypto',
            dappUrl: 'https://app.ubeswap.org/',
            categories: ['exchanges'],
            iconUrl:
              'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
            id: 'ubeswap',
          },
        ],
        activeDapp: {
          name: 'Ubeswap',
          description: 'Swap any token, enter a pool, or farm your crypto',
          dappUrl: 'https://app.ubeswap.org/',
          categories: ['exchanges'],
          iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
          id: 'ubeswap',
          openedFrom: 'featured',
        },
      },
    }

    const migratedV1Schema = migrations[131](oldSchemaWithV1Dapp)
    const migratedV2Schema = migrations[131](expectedSchemaWithV2Dapp)

    expect(migratedV1Schema).toMatchObject(expectedSchemaWithV2Dapp)
    expect(migratedV2Schema).toMatchObject(expectedSchemaWithV2Dapp)
  })

  it('works from v132 to v133', () => {
    const oldSchema = v132Schema
    const migratedSchema = migrations[133](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.nfts = {
      nfts: [],
      nftsError: null,
      nftsLoading: false,
    }
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v133 to v134', () => {
    const oldSchema = v133Schema
    const migratedSchema = migrations[134](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.positions.previewApiUrl = null
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v136 to v137', () => {
    const oldSchema = v136Schema
    const migratedSchema = migrations[137](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.walletConnect.sessions = oldSchema.walletConnect.v2.sessions
    expectedSchema.walletConnect.pendingActions = oldSchema.walletConnect.v2.pendingActions
    expectedSchema.walletConnect.pendingSessions = oldSchema.walletConnect.v2.pendingSessions
    delete expectedSchema.walletConnect.v1
    delete expectedSchema.walletConnect.v2
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })
  it('works from v144 to v145', () => {
    // Ensure that all of TokenTransfer, TokenExchange, and NftTransfer migrate correctly.
    // Namely, that the __typename is updated to V3 and that chain is added to each TX.
    // Also check that chain is added to standby transactions.
    const oldSchema = {
      ...v144Schema,
      transactions: {
        ...v144Schema.transactions,
        standbyTransactions: [
          {
            context: { id: 'test' },
            type: TokenTransactionTypeV2.Sent,
            status: TransactionStatus.Pending,
            value: '0.5',
            tokenAddress: 'mock-address',
            comment: '',
            timestamp: 1542300000,
            address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
          },
        ],
        transactions: [
          {
            __typename: 'TokenTransferV2',
            type: TokenTransactionTypeV2.Sent,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            address: 'some-address',
            amount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            metadata: {},
            fees: [],
          },
          {
            __typename: 'NftTransferV2',
            type: TokenTransactionTypeV2.NftReceived,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            nfts: [],
            fees: [],
          },
          {
            __typename: 'TokenExchangeV2',
            type: TokenTransactionTypeV2.Exchange,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            inAmount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            outAmount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            metadata: {},
            fees: [],
          },
        ],
      },
    }
    const expectedSchema = {
      ...v144Schema,
      transactions: {
        ...v144Schema.transactions,
        standbyTransactions: [
          {
            context: { id: 'test' },
            network: Network.Celo,
            type: TokenTransactionTypeV2.Sent,
            status: TransactionStatus.Pending,
            value: '0.5',
            tokenAddress: 'mock-address',
            comment: '',
            timestamp: 1542300000,
            address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
          },
        ],
        transactions: [
          {
            __typename: 'TokenTransferV3',
            network: Network.Celo,
            type: TokenTransactionTypeV2.Sent,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            address: 'some-address',
            amount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            metadata: {},
            fees: [],
          },
          {
            __typename: 'NftTransferV3',
            network: Network.Celo,
            type: TokenTransactionTypeV2.NftReceived,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            nfts: [],
            fees: [],
          },
          {
            __typename: 'TokenExchangeV3',
            network: Network.Celo,
            type: TokenTransactionTypeV2.Exchange,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            inAmount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            outAmount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            metadata: {},
            fees: [],
          },
        ],
      },
    }
    const migratedSchema = migrations[145](oldSchema)
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v145 to v146', () => {
    const oldSchema = v145Schema
    const migratedSchema = migrations[146](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.localCurrency.usdToLocalRate =
      oldSchema.localCurrency.exchangeRates[Currency.Dollar]
    delete expectedSchema.localCurrency.exchangeRates
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v146 to v147', () => {
    const oldSchema = {
      ...v146Schema,
      transactions: {
        ...v146Schema.transactions,
        standbyTransactions: [
          {
            context: { id: 'test' },
            network: Network.Celo,
            type: TokenTransactionTypeV2.Sent,
            status: TransactionStatus.Pending,
            value: '0.5',
            tokenAddress: 'mock-address',
            comment: '',
            timestamp: 1542300000,
            address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
          },
        ],
        transactions: [
          {
            __typename: 'TokenTransferV3',
            type: TokenTransactionTypeV2.Sent,
            network: Network.Celo,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            address: 'some-address',
            amount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            metadata: {},
            fees: [],
          },
          {
            __typename: 'NftTransferV3',
            network: Network.Ethereum,
            type: TokenTransactionTypeV2.NftReceived,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            nfts: [],
            fees: [],
          },
        ],
      },
    }
    const expectedSchema = {
      ...v146Schema,
      transactions: {
        ...v146Schema.transactions,
        standbyTransactions: [
          {
            context: { id: 'test' },
            networkId: NetworkId['celo-alfajores'],
            type: TokenTransactionTypeV2.Sent,
            status: TransactionStatus.Pending,
            value: '0.5',
            tokenAddress: 'mock-address',
            comment: '',
            timestamp: 1542300000,
            address: '0xd68360cce1f1ff696d898f58f03e0f1252f2ea33',
          },
        ],
        transactions: [
          {
            __typename: 'TokenTransferV3',
            networkId: NetworkId['celo-alfajores'],
            type: TokenTransactionTypeV2.Sent,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            address: 'some-address',
            amount: {
              value: new BigNumber(0),
              tokenAddress: 'some-token-address',
              localAmount: {
                value: new BigNumber(1),
                currencyCode: 'USD',
                exchangeRate: '1',
              },
            },
            metadata: {},
            fees: [],
          },
          {
            __typename: 'NftTransferV3',
            networkId: NetworkId['ethereum-sepolia'],
            type: TokenTransactionTypeV2.NftReceived,
            transactionHash: '123',
            timestamp: 456,
            block: '789',
            nfts: [],
            fees: [],
          },
        ],
      },
    }
    const migratedSchema = migrations[147](oldSchema)
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from v148 to v149', () => {
    expect(
      migrations[149]({
        ...v148Schema,
        app: {
          ...v148Schema.app,
          activeScreen: 'AppLoading',
        },
      })
    ).toStrictEqual({
      ...v148Schema,
      app: {
        ...v148Schema.app,
        activeScreen: 'Main',
      },
    })
  })

  it('works from 159 to 160', () => {
    const preMigrationSchema = {
      ...v159Schema,
    }
    preMigrationSchema.app.activeScreen = 'PaymentRequestConfirmation'
    const migratedSchema = migrations[160](preMigrationSchema)

    // paymentRequest dropped, activeScreen changed to Main from PaymentRequestConfirmation
    expect('paymentRequest' in migratedSchema).toBe(false)
    expect(migratedSchema.app.activeScreen).toEqual('Main')

    // should otherwise be equal
    expect(_.omit(migratedSchema, 'app.activeScreen')).toStrictEqual(
      _.omit(preMigrationSchema, 'app.activeScreen', 'paymentRequest')
    )
  })

  it('works from 160 to 161', () => {
    const preMigrationSchema = {
      ...v159Schema,
    }
    preMigrationSchema.transactions.standbyTransactions = [
      {
        context: { id: 'someId' },
        networkId: 'celo-alfajores',
        type: 'SENT',
        status: TransactionStatus.Pending,
        value: '123',
        tokenId: 'someTokenId',
        tokenAddress: '0xabc',
        comment: 'some comment',
        timestamp: 123456789,
        address: '0x123',
        hash: 'someHash',
      },
    ]
    const migratedSchema = migrations[161](preMigrationSchema)

    expect(migratedSchema.transactions.standbyTransactions).toEqual([
      {
        __typename: 'TokenTransferV3',
        type: TokenTransactionTypeV2.Sent,
        context: { id: 'someId' },
        networkId: 'celo-alfajores',
        amount: {
          value: '123',
          tokenId: 'someTokenId',
          tokenAddress: '0xabc',
        },
        timestamp: 123456789,
        address: '0x123',
        transactionHash: 'someHash',
        metadata: {
          comment: 'some comment',
        },
        status: TransactionStatus.Pending,
      },
    ])
  })

  it('works from 164 to 165', () => {
    const preMigrationSchema = {
      ...v164Schema,
    }
    const celoSwap = {
      __typename: 'TokenExchangeV3',
      type: 'SWAP_TRANSACTION',
      networkId: 'celo-alfajores',
      block: '22127052',
      transactionHash: '0x28fc7261a01bbbe97d5cc1f4c41ccf278bb9980ab12b4cd4bf62b76f137a6691',
    }
    const celoTransfer = {
      __typename: 'TokenTransferV3',
      block: '22115616',
      transactionHash: '0x9fa0eb09da50ead38ba96fba8e7d8d341af81fd407cda0fae400943c173371c1',
      type: 'SENT',
      // no networkId, for older clients
    }
    const ethereumTransfer = {
      __typename: 'TokenTransferV3',
      block: '22115737',
      transactionHash: '0x8f3cb9816418ec3df206b914d88285f3eb251b6a07a8b89b11379eed57fec22e',
      type: 'SENT',
      networkId: 'ethereum-sepolia',
    }
    preMigrationSchema.transactions.transactions = [celoSwap, ethereumTransfer, celoTransfer]
    const migratedSchema = migrations[165](preMigrationSchema)

    expect(migratedSchema.transactions.transactionsByNetworkId).toEqual({
      [NetworkId['celo-alfajores']]: [celoSwap, celoTransfer],
      [NetworkId['ethereum-sepolia']]: [ethereumTransfer],
    })
    expect('transactions' in migratedSchema.transactions).toBe(false)
  })

  it('works from 166 to 167', () => {
    const oldSchema = v166Schema
    const migratedSchema = migrations[167](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.app.rampCashInButtonExpEnabled = false
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 167 to 168', () => {
    const oldSchema = v167Schema
    const migratedSchema = migrations[168](oldSchema)
    const expectedSchema: any = _.omit(oldSchema, 'swap.swapUserInput')
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 171 to 172', () => {
    const oldSchema = v171Schema
    const migratedSchema = migrations[172](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.swap.swapInfo
    expectedSchema.swap.currentSwap = null
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 172 to 173', () => {
    const oldSchema = v172Schema
    const migratedSchema = migrations[173](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.swap.swapState
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 174 to 175', () => {
    const oldSchema = v174Schema
    const migratedSchema = migrations[175](oldSchema)

    // CELO
    const celoToken = migratedSchema.tokens.tokenBalances['celo-alfajores:native']
    expect(celoToken).not.toHaveProperty('isCoreToken')
    expect(celoToken).toHaveProperty('isFeeCurrency', true)
    expect(celoToken).toHaveProperty('canTransferWithComment', true)

    // cUSD
    const cUSDToken =
      migratedSchema.tokens.tokenBalances[
        'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1'
      ]
    expect(cUSDToken).not.toHaveProperty('isCoreToken')
    expect(cUSDToken).toHaveProperty('isFeeCurrency', true)
    expect(cUSDToken).toHaveProperty('canTransferWithComment', true)

    // cEUR
    const cEURToken =
      migratedSchema.tokens.tokenBalances[
        'celo-alfajores:0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f'
      ]
    expect(cEURToken).not.toHaveProperty('isCoreToken')
    expect(cEURToken).toHaveProperty('isFeeCurrency', true)
    expect(cEURToken).toHaveProperty('canTransferWithComment', true)

    // Test Token
    const testToken =
      migratedSchema.tokens.tokenBalances[
        'celo-alfajores:0x048f47d358ec521a6cf384461d674750a3cb58c8'
      ]
    expect(testToken).not.toHaveProperty('isCoreToken')
    expect(testToken).not.toHaveProperty('isFeeCurrency')
    expect(testToken).not.toHaveProperty('canTransferWithComment')

    // Moola
    const moolaToken =
      migratedSchema.tokens.tokenBalances[
        'celo-alfajores:0x17700282592D6917F6A73D0bF8AcCf4D578c131e'
      ]
    expect(moolaToken).not.toHaveProperty('isCoreToken')
    expect(moolaToken).not.toHaveProperty('isFeeCurrency')
    expect(moolaToken).not.toHaveProperty('canTransferWithComment')
  })

  it('works from 176 to 177', () => {
    const oldSchema = v176Schema
    const migratedSchema = migrations[177](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.swap.priceImpactWarningThreshold =
      expectedSchema.swap.priceImpactWarningThreshold * 100
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 177 to 178', () => {
    const oldSchema = v177Schema
    const migratedSchema = migrations[178](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    delete expectedSchema.swap.guaranteedSwapPriceEnabled
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 178 to 179', () => {
    const oldSchema = v178Schema
    const migratedSchema = migrations[179](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.priceHistory = {}
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })

  it('works from 179 to 180', () => {
    const oldSchema = {
      ...v179Schema,
      send: {
        ...v179Schema.send,
        recentRecipients: [
          // invitable recipients don't include an address
          mockRecipient,
          mockInvitableRecipient,
          mockRecipient2,
          mockInvitableRecipient2,
        ],
      },
    }
    const migratedSchema = migrations[180](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.send.recentRecipients = [mockRecipient, mockRecipient2]
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })
  it('works from 197 to 198', () => {
    const oldSchema = {
      ...v197Schema,
      home: {
        ...v197Schema.home,
        nftCelebration: {
          networkId: 'celo-alfajores',
          contractAddress: '0xTEST',
          displayed: true,
        },
      },
    }
    const migratedSchema = migrations[198](oldSchema)
    const expectedSchema: any = _.cloneDeep(oldSchema)
    expectedSchema.home.nftCelebration = null
    expect(migratedSchema).toStrictEqual(expectedSchema)
  })
})
