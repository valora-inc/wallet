import { ADJECTIVES, NOUNS } from './constants'

export const chooseRandomWord = (wordList: string[]) => {
  return wordList[Math.floor(Math.random() * wordList.length)]
}

export const generateRandomUsername = (
  forbiddenAdjectives: Set<string>,
  forbiddenNouns: Set<string>
): string => {
  const adjectiveList = ADJECTIVES.filter((adj) => !forbiddenAdjectives.has(adj))
  const nounList = NOUNS.filter((noun) => !forbiddenNouns.has(noun))
  return `${chooseRandomWord(adjectiveList)} ${chooseRandomWord(nounList)}`
}
