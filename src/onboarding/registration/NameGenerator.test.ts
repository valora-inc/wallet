import { chooseRandomWord, generateRandomUsername } from 'src/onboarding/registration/NameGenerator'

const ADJECTIVES = ['Adjective_1', 'Adjective_2', 'Bad_Adjective']
const NOUNS = ['Noun_1', 'Noun_2', 'Bad_Noun']

jest.mock('src/onboarding/registration/constants', () => ({
  ADJECTIVES,
  NOUNS,
}))

describe('NameGenerator', () => {
  const mockRandom = jest.fn()
  beforeEach(() => {
    jest.spyOn(global.Math, 'random').mockImplementation(mockRandom)
  })

  afterEach(() => {
    jest.spyOn(global.Math, 'random').mockRestore()
  })

  it('random word selector behaves as expected', () => {
    const wordList = ['a', 'b', 'c', 'd']
    const bIndex = 1
    mockRandom.mockReturnValue(bIndex / wordList.length)
    expect(chooseRandomWord(wordList)).toEqual('b')

    const dIndex = 3
    mockRandom.mockReturnValue(dIndex / wordList.length)
    expect(chooseRandomWord(wordList)).toEqual('d')
  })

  it('usernames appear as expected', () => {
    const adjectiveIndex = 0
    const nounIndex = 1
    mockRandom
      .mockReturnValueOnce(adjectiveIndex / ADJECTIVES.length)
      .mockReturnValueOnce(nounIndex / NOUNS.length)
    const username = generateRandomUsername(new Set(), new Set())
    expect(username).toEqual(`${ADJECTIVES[adjectiveIndex]} ${NOUNS[nounIndex]}`)
  })

  it('bad usernames do not appear', () => {
    const badAdjIndex = 2
    const badNounIndex = 2
    mockRandom
      .mockReturnValueOnce(badAdjIndex / ADJECTIVES.length)
      .mockReturnValueOnce(badNounIndex / NOUNS.length)
    const username = generateRandomUsername(
      new Set([ADJECTIVES[badAdjIndex]]),
      new Set([NOUNS[badNounIndex]])
    )
    expect(username).not.toEqual(`${ADJECTIVES[badAdjIndex]} ${NOUNS[badNounIndex]}`)
  })
})
