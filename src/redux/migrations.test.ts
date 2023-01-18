import _ from 'lodash'
import { FinclusiveKycStatus } from 'src/account/reducer'
import { initialState as exchangeInitialState } from 'src/exchange/reducer'
import { migrations } from 'src/redux/migrations'
import { Currency } from 'src/utils/currencies'
import {
  DEFAULT_DAILY_PAYMENT_LIMIT_CUSD_LEGACY,
  v0Schema,
  v13Schema,
  v14Schema,
  v15Schema,
  v16Schema,
  v17Schema,
  v18Schema,
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
  v103Schema,
  vNeg1Schema,
  v104Schema,
} from 'test/schemas'

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
      Object {
        "acceptedAttestationCodes": Array [],
        "addressToDataEncryptionKey": Object {},
        "addressToDisplayName": Object {},
        "addressToE164Number": Object {},
        "askedContactsPermission": false,
        "attestationInputStatus": Array [
          "Inputting",
          "Disabled",
          "Disabled",
        ],
        "attestationsCode": Array [],
        "contactMappingProgress": Object {
          "current": 0,
          "total": 0,
        },
        "e164NumberToAddress": Object {},
        "e164NumberToSalt": Object {},
        "hasSeenVerificationNux": true,
        "importContactsProgress": Object {
          "current": 0,
          "status": 0,
          "total": 0,
        },
        "isLoadingImportContacts": false,
        "lastRevealAttempt": null,
        "matchedContacts": Object {},
        "numCompleteAttestations": 0,
        "secureSendPhoneNumberMapping": Object {},
        "startedVerification": false,
        "verificationFailed": false,
        "verificationStatus": 0,
        "walletToAccountAddress": Object {},
      }
    `)
    expect(migratedSchema.verify).toMatchInlineSnapshot(`
      Object {
        "TEMPORARY_override_withoutVerification": undefined,
        "actionableAttestations": Array [],
        "currentState": Object {
          "type": "Idle",
        },
        "komenci": Object {
          "callbackUrl": undefined,
          "captchaToken": "",
          "errorTimestamps": Array [],
          "sessionActive": false,
          "sessionToken": "",
          "unverifiedMtwAddress": null,
        },
        "komenciAvailable": "UNKNOWN",
        "retries": 0,
        "status": Object {
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
    expectedSchema.web3.twelveWordSeedPhraseEnabled = false

    expect(migratedSchema).toStrictEqual(expectedSchema)
  })
})
