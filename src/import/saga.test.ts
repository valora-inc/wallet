import { createMockTask } from '@redux-saga/testing-utils'
import BigNumber from 'bignumber.js'
import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { dynamic } from 'redux-saga-test-plan/providers'
import { call, delay, fork, select } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account/actions'
import { initializeAccountSaga } from 'src/account/saga'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { numberVerifiedCentrallySelector, skipVerificationSelector } from 'src/app/selectors'
import { storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import { importBackupPhraseFailure, importBackupPhraseSuccess } from 'src/import/actions'
import { importBackupPhraseSaga, MNEMONIC_AUTOCORRECT_TIMEOUT } from 'src/import/saga'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { fetchTokenBalanceInWeiWithRetry } from 'src/tokens/saga'
import { Currency } from 'src/utils/currencies'
import { assignAccountFromPrivateKey } from 'src/web3/saga'

const mockPhraseValid =
  'oil please secret math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course expire'
// Same phrase as above, but with the last word replaced with a different BIP-39 word.
const mockPhraseInvalidChecksum =
  'oil please secret math suffer mesh retreat prosper quit traffic special creek educate rate weasel wide swing crystal day swim frost oxygen course tent'
// Same phrase as above, but with several words altered to invalid words.
const mockPhraseInvalidWords =
  'oil please secret math surfer mesh retreat prosper quit traffic spectical creek educate rate weasel wade swig crystal day swim frosty oxygen course expire'
const mockValidSpanishPhrase =
  'tajo fiera asunto tono aroma palma toro caos lobo espada número rato hacha largo pedir cemento urbe tejado volcán mimo grueso juvenil pueblo desvío'
// Account derived from the English mnemonic above.
const mockAccount = '0xb43FBBBF76973b64e0980f5f4781d7cE9A7DBDDb'

const mockPhraseValidShort = 'science skull clay erase trap modify sentence skirt junk code era cup'
// Same phrase as above, but with the last word replaced with a different BIP-39 word.
const mockPhraseInvalidChecksumShort =
  'science skull clay erase trap modify sentence skirt junk code era tent'
// Same phrase as above, but with several words altered to invalid words.
const mockPhraseInvalidWordsShort =
  'science skull clay erase trap modify sentence shirt junk code era cap'
// Account derived from the English mnemonic above.
const mockAccountShortPhrase = '0xFdCd75D10fcfCd12537C7CE976086AE6C12eBcEC'

// Creates a mock task factory to use as a dynamic value for redux-saga-test-plan mock.
// If not value is provided, the task will never complete.
const mockBalanceTask = (value?: number) => {
  return () => {
    const task = createMockTask()
    // @ts-ignore Add an undocumented method, called by join, to Task ಠ_ಠ
    task.isAborted = () => false
    // @ts-ignore Add an undocumented field, called by join, to Task ಠ_ಠ ಠ_ಠ
    task.joiners = []

    if (value !== undefined) {
      task.setResult(new BigNumber(value))
      task.setRunning(false)
    }

    return task
  }
}

describe('Import wallet saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const expectSuccessfulSagaWithPhrase = async (phrase: string) => {
    await expectSaga(importBackupPhraseSaga, { phrase, useEmptyWallet: false })
      .provide([
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(10))],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, phrase, mockAccount), true],
        [call(initializeAccountSaga), undefined],
        [select(numberVerifiedCentrallySelector), false],
        [select(recoveringFromStoreWipeSelector), false],
        [select(skipVerificationSelector), false],
      ])
      .put(setBackupCompleted())
      .put(refreshAllBalances())
      .put(importBackupPhraseSuccess())
      .run()
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationStartScreen)
  }

  it('imports a valid phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockPhraseValid)
  })

  it('imports a valid 12 word phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockPhraseValidShort)
  })

  it('imports a valid spanish phrase', async () => {
    await expectSuccessfulSagaWithPhrase(mockValidSpanishPhrase)
  })

  it('initializes account and navigates to home if skipVerification is true', async () => {
    await expectSaga(importBackupPhraseSaga, {
      phrase: mockPhraseValid,
      useEmptyWallet: false,
    })
      .provide([
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(10))],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, mockPhraseValid, mockAccount), true],
        [select(recoveringFromStoreWipeSelector), false],
        [select(skipVerificationSelector), true],
        [call(initializeAccountSaga), undefined],
        [select(numberVerifiedCentrallySelector), false],
      ])
      .put(setBackupCompleted())
      .put(refreshAllBalances())
      .call(initializeAccountSaga)
      .put(setHasSeenVerificationNux(true))
      .put(importBackupPhraseSuccess())
      .run()
    expect(navigateHome).toHaveBeenCalledWith()
  })

  it('initializes account and navigates to home if the phone number is already verified', async () => {
    await expectSaga(importBackupPhraseSaga, {
      phrase: mockPhraseValid,
      useEmptyWallet: false,
    })
      .provide([
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(10))],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, mockPhraseValid, mockAccount), true],
        [select(recoveringFromStoreWipeSelector), false],
        [select(skipVerificationSelector), false],
        [call(initializeAccountSaga), undefined],
        [select(numberVerifiedCentrallySelector), true],
      ])
      .put(setBackupCompleted())
      .put(refreshAllBalances())
      .call(initializeAccountSaga)
      .put(setHasSeenVerificationNux(true))
      .put(importBackupPhraseSuccess())
      .run()
    expect(navigateHome).toHaveBeenCalledWith()
  })

  it.each`
    wordCount | phrase
    ${'12'}   | ${mockPhraseInvalidChecksumShort}
    ${'24'}   | ${mockPhraseInvalidChecksum}
  `('fails for a $wordCount word phrase invalid checksum', async ({ phrase }) => {
    await expectSaga(importBackupPhraseSaga, {
      phrase,
      useEmptyWallet: false,
    })
      .provide([
        [select(currentLanguageSelector), 'english'],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(0))],
        [delay(MNEMONIC_AUTOCORRECT_TIMEOUT), true],
      ])
      .put(showError(ErrorMessages.INVALID_BACKUP_PHRASE))
      .put(importBackupPhraseFailure())
      .run()
  })

  it.each`
    wordCount | walletAddress             | phrase
    ${'12'}   | ${mockAccountShortPhrase} | ${mockPhraseInvalidWordsShort}
    ${'24'}   | ${mockAccount}            | ${mockPhraseInvalidWords}
  `(
    'imports a $wordCount word phrase with invalid words after autocorrection',
    async ({ phrase, walletAddress }) => {
      await expectSaga(importBackupPhraseSaga, {
        phrase,
        useEmptyWallet: false,
      })
        .provide([
          [select(currentLanguageSelector), 'english'],
          // Respond only to the true correct address with a positive balance.
          [
            fork(fetchTokenBalanceInWeiWithRetry, Currency.Dollar, walletAddress),
            dynamic(mockBalanceTask(10)),
          ],
          [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask())],
          [matchers.call.fn(assignAccountFromPrivateKey), walletAddress],
          [call(storeMnemonic, mockPhraseValid, walletAddress), true],
          [select(recoveringFromStoreWipeSelector), false],
          [select(skipVerificationSelector), false],
          [call(initializeAccountSaga), undefined],
          [select(numberVerifiedCentrallySelector), false],
        ])
        .put(setBackupCompleted())
        .put(refreshAllBalances())
        .put(importBackupPhraseSuccess())
        .run()
    }
  )

  it('rejects a phrase with invalid words after failed autocorrection', async () => {
    await expectSaga(importBackupPhraseSaga, {
      phrase: mockPhraseInvalidWords,
      useEmptyWallet: false,
    })
      .provide([
        [select(currentLanguageSelector), 'english'],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(0))],
        [delay(MNEMONIC_AUTOCORRECT_TIMEOUT), true],
      ])
      .put(
        showError(ErrorMessages.INVALID_WORDS_IN_BACKUP_PHRASE, null, {
          invalidWords: 'surfer, spectical, wade, swig, frosty',
        })
      )
      .put(importBackupPhraseFailure())
      .run()
  })

  it('asks the user to confirm import of an empty phrase', async () => {
    await expectSaga(importBackupPhraseSaga, { phrase: mockPhraseValid, useEmptyWallet: false })
      .provide([
        [select(currentLanguageSelector), 'english'],
        [matchers.fork.fn(fetchTokenBalanceInWeiWithRetry), dynamic(mockBalanceTask(0))],
      ])
      .run()

    // Expect that the user be redirected back to the import wallet screen.
    expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet, {
      clean: false,
      showZeroBalanceModal: true,
    })
  })
})
