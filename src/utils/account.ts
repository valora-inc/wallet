// Initially copied from https://github.com/celo-org/developer-tooling/blob/467d4e16444535d341bd2296d41c386f1dab187f/packages/sdk/cryptographic-utils/src/account.ts
import * as bip39 from '@scure/bip39'
import { get as levenshteinDistance } from 'fast-levenshtein'
// Provides fast and secure cryptographic functions from OpenSSL
// Note: we could also just import "crypto", since react-native-quick-crypto polyfills it
// But at least it's explicit here and we have more guarantees the expected implementation is being used
import crypto from 'react-native-quick-crypto'
import { privateKeyToAddress } from 'src/utils/address'
import { bytesToHex } from 'viem'
import {
  HDKey,
  english,
  french,
  italian,
  japanese,
  korean,
  portuguese,
  simplifiedChinese,
  spanish,
  traditionalChinese,
} from 'viem/accounts'

export const CELO_DERIVATION_PATH_BASE = "m/44'/52752'/0'"

export enum MnemonicStrength {
  s128_12words = 128,
  s256_24words = 256,
}

export enum MnemonicLanguages {
  chinese_simplified,
  chinese_traditional,
  english,
  french,
  italian,
  japanese,
  korean,
  spanish,
  portuguese,
}

interface Bip39 {
  mnemonicToSeed: (mnemonic: string, password?: string) => Promise<Uint8Array>
  generateMnemonic: (strength?: number, wordlist?: string[]) => Promise<string>
  validateMnemonic: (mnemonic: string, wordlist?: string[]) => boolean
}

const wordlists: Record<MnemonicLanguages, string[]> = {
  [MnemonicLanguages.english]: english,
  [MnemonicLanguages.french]: french,
  [MnemonicLanguages.italian]: italian,
  [MnemonicLanguages.japanese]: japanese,
  [MnemonicLanguages.korean]: korean,
  [MnemonicLanguages.portuguese]: portuguese,
  [MnemonicLanguages.chinese_simplified]: simplifiedChinese,
  [MnemonicLanguages.spanish]: spanish,
  [MnemonicLanguages.chinese_traditional]: traditionalChinese,
} as const

function salt(passphrase: string) {
  return `mnemonic${passphrase}`.normalize('NFKD')
}

// Note: here we don't use bip39.mnemonicToSeed because it's currently implemented in JS
// and it's slow:
// - 3+ seconds on a iPhone 13 Pro
// - 10+ seconds on a Pixel 4a
async function _mnemonicToSeed(mnemonic: string, passphrase = '') {
  const mnemonicBuffer = Buffer.from(mnemonic, 'utf8')
  const saltBuffer = Buffer.from(salt(passphrase), 'utf8')
  return new Promise<Uint8Array>((resolve, reject) =>
    crypto.pbkdf2(mnemonicBuffer, saltBuffer, 2048, 64, 'SHA-512', (err, derivedKey) => {
      if (err) {
        reject(err)
      } else {
        if (!derivedKey) {
          // This should never happen
          reject(new Error('No derived key'))
        } else {
          resolve(derivedKey)
        }
      }
    })
  )
}

// Note: we could use bip39.generateMnemonic
// because it uses crypto.randomBytes too
// but at least we have the guarantee that the expected implementation is being used
function _generateMnemonic(
  strength?: number,
  wordlist: string[] = wordlists[MnemonicLanguages.english]
): Promise<string> {
  return new Promise((resolve, reject) => {
    strength = strength || 128

    crypto.randomBytes(strength / 8, (error, randomBytesBuffer) => {
      if (error) {
        reject(error)
      } else {
        if (!randomBytesBuffer) {
          // This should never happen
          reject(new Error('No random bytes generated'))
        } else {
          resolve(bip39.entropyToMnemonic(randomBytesBuffer, wordlist))
        }
      }
    })
  })
}

function _validateMnemonic(
  mnemonic: string,
  wordlist: string[] = wordlists[MnemonicLanguages.english]
) {
  return bip39.validateMnemonic(mnemonic, wordlist)
}

const bip39Wrapper: Bip39 = {
  mnemonicToSeed: _mnemonicToSeed,
  generateMnemonic: _generateMnemonic,
  validateMnemonic: _validateMnemonic,
}

export async function generateMnemonic(
  strength: MnemonicStrength = MnemonicStrength.s256_24words,
  language?: MnemonicLanguages
): Promise<string> {
  return bip39Wrapper.generateMnemonic(strength, getWordList(language))
}

export function validateMnemonic(mnemonic: string, language?: MnemonicLanguages) {
  if (language !== undefined) {
    return bip39Wrapper.validateMnemonic(mnemonic, getWordList(language))
  }

  const languages = getAllLanguages()
  for (const guessedLanguage of languages) {
    if (bip39Wrapper.validateMnemonic(mnemonic, getWordList(guessedLanguage))) {
      return true
    }
  }

  return false
}

/**
 * Return a list of the words in the mnemonic that are not in the list of valid BIP-39 words for the
 * specified or detected language.
 *
 * @remarks Will return undefined if the language cannot be detected (e.g.  all the words are
 * invalid, or half of the valid words are from one language and the other half from another.)
 */
export function invalidMnemonicWords(
  mnemonic: string,
  language?: MnemonicLanguages
): string[] | undefined {
  const words = splitMnemonic(mnemonic)
  const detectedLanguage = language ?? detectMnemonicLanguage(words)
  if (detectedLanguage === undefined) {
    return undefined
  }

  const wordSet = new Set(getWordList(detectedLanguage))
  return words.filter((word) => !wordSet.has(word))
}

/**
 * Normalize the mnemonic phrase to eliminate a number of inconsistencies with standard BIP-39
 * phrases that are likely to arise when a user manually enters a phrase.
 *
 * @remarks Note that this does not guarantee that the output is a valid mnemonic phrase, or even
 * that all the words in the phrase are contained in a valid wordlist.
 */
export function normalizeMnemonic(mnemonic: string, language?: MnemonicLanguages): string {
  const words = splitMnemonic(mnemonic)
  const lowered = words.map((word) => word.toLowerCase())
  const detectedLanguage = language ?? detectMnemonicLanguage(lowered)

  // If the language is unknown, do not run further normalizations.
  if (detectedLanguage === undefined) {
    return joinMnemonic(lowered, detectedLanguage)
  }

  return joinMnemonic(formatNonAccentedWords(lowered, detectedLanguage), detectedLanguage)
}

// https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
function normalizeAccents(str: string) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Scans the provided phrase and adds accents to words where the are not provided, or provided
 * inconsistently with the BIP-39 standard. Ensures that phrases differing only by accents will
 * validate after being cast into the normalized form.
 *
 * @remarks Words should be converted to lower case before being given to this function.
 */
function formatNonAccentedWords(words: string[], language: MnemonicLanguages): string[] {
  if (isLatinBasedLanguage(language)) {
    const wordList = getWordList(language)
    const normalizedWordMap = new Map(wordList.map((word) => [normalizeAccents(word), word]))
    return words.map((word) => normalizedWordMap.get(normalizeAccents(word)) ?? word)
  }

  return words
}

function isLatinBasedLanguage(language: MnemonicLanguages): boolean {
  // Use exhaustive switch to ensure that every language is accounted for.
  switch (language) {
    case MnemonicLanguages.english:
    case MnemonicLanguages.french:
    case MnemonicLanguages.italian:
    case MnemonicLanguages.spanish:
    case MnemonicLanguages.portuguese:
      return true
    case MnemonicLanguages.chinese_simplified:
    case MnemonicLanguages.chinese_traditional:
    case MnemonicLanguages.japanese:
    case MnemonicLanguages.korean:
      return false
  }
}

// Unify the bip39.wordlists (otherwise depends on the instance of the bip39)
export function getWordList(language: MnemonicLanguages = MnemonicLanguages.english): string[] {
  return wordlists[language]
}

export function getAllLanguages(): MnemonicLanguages[] {
  return [
    MnemonicLanguages.chinese_simplified,
    MnemonicLanguages.chinese_traditional,
    MnemonicLanguages.english,
    MnemonicLanguages.french,
    MnemonicLanguages.italian,
    MnemonicLanguages.japanese,
    MnemonicLanguages.korean,
    MnemonicLanguages.spanish,
    MnemonicLanguages.portuguese,
  ]
}

function mnemonicLengthFromStrength(strength: MnemonicStrength): number {
  switch (strength) {
    case MnemonicStrength.s128_12words:
      return 12
    case MnemonicStrength.s256_24words:
      return 24
  }
}

/**
 * Splits a mnemonic phrase into words, handling extra whitespace anywhere in the phrase.
 */
function splitMnemonic(mnemonic: string): string[] {
  return [...mnemonic.trim().split(/\s+/)]
}

/**
 * Joins a list of words into a mnemonic phrase. Inverse of splitMnemonic.
 */
function joinMnemonic(words: string[], language: MnemonicLanguages | undefined): string {
  return words.join(language === MnemonicLanguages.japanese ? '\u3000' : ' ')
}

/**
 * Detects the language of tokenized mnemonic phrase by applying a heuristic.
 *
 * @remarks Uses a heuristic of returning the language with the most matching words. In practice, we
 * expect all words to come from a single language, also some may be misspelled or otherwise
 * malformed. It may occasionally occur that a typo results in word from another language (e.g. bag
 * -> bagr) but this should occur at most once or twice per phrase.
 */
function detectMnemonicLanguage(
  words: string[],
  candidates?: MnemonicLanguages[]
): MnemonicLanguages | undefined {
  // Assign a match score to each language by how many words of the phrase are in each language.
  const scores: [MnemonicLanguages, number][] = (candidates ?? getAllLanguages()).map(
    (candidate) => {
      const wordSet = new Set(getWordList(candidate))
      const score = words.reduce((count, word) => (wordSet.has(word) ? count + 1 : count), 0)
      return [candidate, score]
    }
  )

  // Reduce to the highest scoring candidate(s). Note that it is possible for multiple candidates to
  // have the same score, but it likely to occur only for specially constructed phrases.
  const [winners, highscore] = scores.reduce(
    ([leaders, leadingScore], [candidate, score]) => {
      if (score > leadingScore) {
        return [[candidate], score]
      } else if (score === leadingScore) {
        return [[...leaders, candidate], leadingScore]
      }
      return [leaders, leadingScore]
    },
    [[], 0] as [MnemonicLanguages[], number]
  )

  if (winners.length !== 1 || highscore < 1) {
    return undefined
  }
  return winners[0]
}

/**
 * Generates a list of suggested corrections to the mnemonic phrase based on a set of heuristics.
 *
 * @remarks
 * Each yielded suggestion represents an attempt to correct the seed phrase by replacing any invalid
 * words with the most likely valid words. Returned suggestions phrases are ordered by probability
 * based on a noisy channel model, described in detail in CIP-39.
 *
 * The generated list of suggestions is exponential in size, and effectively infinite. One should
 * not attempt to generate the entire list.
 *
 * All yielded suggestions will have a valid checksum, but are not guaranteed to correspond to any
 * given wallet. If the phrase is being used to recover a wallet with non-zero balance, it is
 * suggested that the caller check the balance of the derived wallet address. If the balance is
 * non-zero, they can be sure that the phrase is correct. If it is zero, then they should continue
 * and try the next suggestion.
 *
 * It is recommended to normalize the mnemonic phrase before inputting to this function.
 *
 * @privateRemarks
 * TODO(victor): Include a heuristic rule for phrase-level corrections, such as word ordering swaps.
 */
export function* suggestMnemonicCorrections(
  mnemonic: string,
  language?: MnemonicLanguages,
  strength?: MnemonicStrength
): Generator<string> {
  const words = splitMnemonic(mnemonic)

  // Function does not currently attempt to correct phrases with an incorrect number of words.
  const expectedLength = strength && mnemonicLengthFromStrength(strength)
  if ((expectedLength && words.length !== expectedLength) || words.length % 3 !== 0) {
    return
  }

  // If the language is not provided or detected, no suggestions can be given.
  const lang = language ?? detectMnemonicLanguage(words)
  if (lang === undefined) {
    return
  }

  // Iterate over the generator of corrections, and return those that have a valid checksum.
  for (const suggestion of suggestUnvalidatedCorrections(words, lang)) {
    const phrase = joinMnemonic(suggestion, lang)
    if (validateMnemonic(phrase, lang)) {
      yield phrase
    }
  }
}

// Suggestions for a particular word in a phrase keyed by distance. Values are unordered suggested
// word lists at the edit distance indicated by the key.
type SuggestionsByDistance = Map<number, string[]>

/// Generates a list of suggested phases based on an edit distance correction heuristic.
function* suggestUnvalidatedCorrections(
  words: string[],
  language: MnemonicLanguages
): Generator<string[]> {
  // Create a list of suggestions for each word in the phrase.
  // Note that for valid words, the input word will be in the suggestions lists at edit distance 0.
  // Valid words are not considered separately because it's possible for an error to yield a valid
  // word, (e.g. "tent" mistyped as "rent", both of which are valid words)
  const spotSuggestions: SuggestionsByDistance[] = words.map((word) =>
    wordSuggestions(word, language)
  )

  // Combine the given suggestions lists to produce all combinations with weight, defined as the sum
  // edit distances for all chosen words, equal to the given weight value.
  // The set of suggestions yielded with a given weight is disjoint from the set of suggestions
  // yielded with any other given weight.
  function* combineSuggestions(
    suggestionsLists: SuggestionsByDistance[],
    weight: number
  ): Generator<string[], undefined, undefined> {
    if (suggestionsLists.length < 1 || weight < 0) {
      throw Error('programming error: suggestions map must have at least one entry')
    }
    const suggestions = suggestionsLists[0]

    // Base case: When there is only one entry, "consume" the rest of the weight by yielding all
    // words in the suggestions list at edit distance `weight` as singleton lists (i.e. 1 word
    // phrases).
    if (suggestionsLists.length === 1) {
      yield* suggestions.get(weight)?.map((suggestion): string[] => [suggestion]) ?? []
      return
    }

    // Recursion case: When more than one entry exists, consume iteratively 0 to weight units and
    // combine it with all arrays of the remaining weight, generated from removing one entry.
    const remaining = [...suggestionsLists.slice(1)]
    for (const distance of [...suggestions.keys()].sort()) {
      if (distance > weight) {
        break
      }
      for (const list of combineSuggestions(remaining, weight - distance)) {
        for (const suggestion of suggestions.get(distance) ?? []) {
          yield [suggestion, ...list]
        }
      }
    }
  }

  // Increase the weight counter incrementally. At each weight, all returned suggestions are
  // considered equally probably. All suggestions of a higher weight are disjoint from and
  // considered less probably than all suggestions of a lower weight.
  // Note that the stopping condition is chosen arbitrarily to be weight of 1000. In practice, the
  // number of strings with weight less than 1000 is exponentially large and impossible to generate.
  // The stopping condition is included to eventually break when handle malformed phrases.
  //
  // TODO(victor) In the current formulation, only integral weights can be handled, and it is
  // inefficeint to loop over weights that cannot be constructed. Ideally this  should be corrected
  // to allow for non-integral weights.
  for (let weight = 0; weight < 1000; weight++) {
    for (const suggestedWords of combineSuggestions(spotSuggestions, weight)) {
      yield suggestedWords
    }
  }
}

// Given a word and lnaguage, returns a map of all words in the BIP-39 word list for the given
// language by edit distance. This is used as word replacement suggestions.
function wordSuggestions(typo: string, language: MnemonicLanguages): SuggestionsByDistance {
  return getWordList(language)
    .map((word) => ({ distance: levenshteinDistance(typo, word), word }))
    .reduce((map, { distance, word }) => {
      // Reduction uses mutation, instead of spread, as an optimization.
      const list = map.get(distance)
      if (list !== undefined) {
        list.push(word)
      } else {
        map.set(distance, [word])
      }
      return map
    }, new Map<number, string[]>())
}

export async function generateKeys(
  mnemonic: string,
  password?: string,
  changeIndex: number = 0,
  addressIndex: number = 0,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): Promise<{ privateKey: string; publicKey: string; address: string }> {
  const seed: Buffer = await generateSeed(mnemonic, password)
  return generateKeysFromSeed(seed, changeIndex, addressIndex, derivationPath)
}

// keyByteLength truncates the seed. *Avoid its use*
// It was added only because a backwards compatibility bug
async function generateSeed(
  mnemonic: string,
  password?: string,
  keyByteLength: number = 64
): Promise<Buffer> {
  let seed = Buffer.from(await bip39Wrapper.mnemonicToSeed(mnemonic, password ?? ''))
  if (keyByteLength > 0 && seed.byteLength > keyByteLength) {
    const bufAux = Buffer.allocUnsafe(keyByteLength)
    seed.copy(bufAux, 0, 0, keyByteLength)
    seed = bufAux
  }
  return seed
}

function generateKeysFromSeed(
  seed: Buffer,
  changeIndex: number = 0,
  addressIndex: number = 0,
  derivationPath: string = CELO_DERIVATION_PATH_BASE
): { privateKey: string; publicKey: string; address: string } {
  const node = HDKey.fromMasterSeed(seed)
  const newNode = node.derive(
    `${derivationPath ? `${derivationPath}/` : ''}${changeIndex}/${addressIndex}`
  )
  if (!newNode.privateKey) {
    // As we are generating the node from a seed, the node will always have a private key and this would never happened
    throw new Error('utils-accounts@generateKeys: invalid node to derivate')
  }
  const privateKeyHex = bytesToHex(newNode.privateKey)
  const privateKey = privateKeyHex.slice(2)
  const publicKey = bytesToHex(newNode.publicKey!).slice(2)

  return {
    privateKey,
    publicKey,
    address: privateKeyToAddress(privateKeyHex),
  }
}
