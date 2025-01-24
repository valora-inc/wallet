import { chooseRandomWord, generateRandomUsername } from 'src/nameGenerator'

const ADJECTIVES = ['Adjective_1', 'Adjective_2', 'Bad_Adjective']
const NOUNS = ['Noun_1', 'Noun_2', 'Bad_Noun']

jest.mock('src/nameGenerator/names', () => ({
  ADJECTIVES,
  NOUNS,
}))

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest
    .fn()
    .mockReturnValue({ blockedAdjectives: ['Bad_Adjective'], blockedNouns: ['Bad_Noun'] }),
}))

describe('NameGenerator', () => {
  const mockRandom = jest.spyOn(global.Math, 'random')

  afterEach(() => {
    mockRandom.mockReset()
  })

  it('random word selector behaves as expected', () => {
    const wordList = ['a', 'b', 'c', 'd']
    mockRandom.mockReturnValue(0.3)
    expect(chooseRandomWord(wordList)).toEqual('b')

    mockRandom.mockReturnValue(0.9)
    expect(chooseRandomWord(wordList)).toEqual('d')
  })

  it('usernames appear as expected', () => {
    // adjective 1, noun 0
    mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0)
    const username = generateRandomUsername()
    expect(username).toEqual('Adjective_2 Noun_1')
  })

  it('bad usernames do not appear', () => {
    // return last index for both
    mockRandom.mockReturnValueOnce(0.99).mockReturnValueOnce(0.99)
    const username = generateRandomUsername()
    expect(username).toEqual('Adjective_2 Noun_2')
  })
})
