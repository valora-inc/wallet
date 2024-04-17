import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'
import { call, delay, select } from 'redux-saga/effects'
import { setBackupCompleted } from 'src/account/actions'
import { initializeAccountSaga } from 'src/account/saga'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { storeMnemonic } from 'src/backup/utils'
import { refreshAllBalances } from 'src/home/actions'
import { currentLanguageSelector } from 'src/i18n/selectors'
import {
  importBackupPhrase,
  importBackupPhraseFailure,
  importBackupPhraseSuccess,
} from 'src/import/actions'
import { MNEMONIC_AUTOCORRECT_TIMEOUT, importBackupPhraseSaga } from 'src/import/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen, onboardingPropsSelector } from 'src/onboarding/steps'
import { fetchTokenBalancesForAddress } from 'src/tokens/saga'
import { assignAccountFromPrivateKey } from 'src/web3/saga'
import { mockOnboardingProps } from 'test/values'

jest.mock('src/onboarding/steps')

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

describe('Import wallet saga', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  const expectSuccessfulSagaWithPhrase = async (phrase: string) => {
    await expectSaga(importBackupPhraseSaga, importBackupPhrase(phrase, false))
      .provide([
        [
          matchers.call.fn(fetchTokenBalancesForAddress),
          [{ tokenAddress: '0xabc', balance: '10' }],
        ],
        [matchers.call.fn(assignAccountFromPrivateKey), mockAccount],
        [call(storeMnemonic, phrase, mockAccount), true],
        [call(initializeAccountSaga), undefined],
        [select(recoveringFromStoreWipeSelector), false],
        [select(onboardingPropsSelector), mockOnboardingProps],
        [
          call(goToNextOnboardingScreen, {
            firstScreenInCurrentStep: Screens.ImportWallet,
            onboardingProps: mockOnboardingProps,
          }),
          undefined,
        ],
      ])
      .put(setBackupCompleted())
      .put(refreshAllBalances())
      .put(importBackupPhraseSuccess())
      .run()
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

  it.each`
    wordCount | phrase
    ${'12'}   | ${mockPhraseInvalidChecksumShort}
    ${'24'}   | ${mockPhraseInvalidChecksum}
  `('fails for a $wordCount word phrase invalid checksum', async ({ phrase }) => {
    await expectSaga(importBackupPhraseSaga, importBackupPhrase(phrase, false))
      .provide([
        [select(currentLanguageSelector), 'english'],
        [call(fetchTokenBalancesForAddress, mockAccount), []],
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
      await expectSaga(importBackupPhraseSaga, importBackupPhrase(phrase, false))
        .provide([
          [select(currentLanguageSelector), 'english'],
          // Respond only to the true correct address with a positive balance.
          [
            call(fetchTokenBalancesForAddress, walletAddress),
            [{ tokenAddress: '0xabc', balance: '10' }],
          ],
          [matchers.call.fn(fetchTokenBalancesForAddress), []],
          [matchers.call.fn(assignAccountFromPrivateKey), walletAddress],
          [call(storeMnemonic, mockPhraseValid, walletAddress), true],
          [select(recoveringFromStoreWipeSelector), false],
          [call(initializeAccountSaga), undefined],
          [select(phoneNumberVerifiedSelector), false],
        ])
        .put(setBackupCompleted())
        .put(refreshAllBalances())
        .put(importBackupPhraseSuccess())
        .run()
    }
  )

  it('rejects a phrase with invalid words after failed autocorrection', async () => {
    await expectSaga(importBackupPhraseSaga, importBackupPhrase(mockPhraseInvalidWords, false))
      .provide([
        [select(currentLanguageSelector), 'english'],
        [matchers.call.fn(fetchTokenBalancesForAddress), []],
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
    await expectSaga(importBackupPhraseSaga, importBackupPhrase(mockPhraseValid, false))
      .provide([
        [select(currentLanguageSelector), 'english'],
        [matchers.call.fn(fetchTokenBalancesForAddress), []],
      ])
      .run()

    // Expect that the user be redirected back to the import wallet screen.
    expect(navigate).toHaveBeenCalledWith(Screens.ImportWallet, {
      clean: false,
      showZeroBalanceModal: true,
    })
  })
})
