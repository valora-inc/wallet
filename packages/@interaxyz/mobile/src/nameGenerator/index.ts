import { ADJECTIVES, NOUNS } from 'src/nameGenerator/names'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'

export const chooseRandomWord = (wordList: string[]) => {
  return wordList[Math.floor(Math.random() * wordList.length)]
}

export const generateRandomUsername = (): string => {
  const { blockedAdjectives, blockedNouns } = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.USERNAME_BLOCK_LIST]
  )
  const adjectiveList = ADJECTIVES.filter((adj) => !new Set(blockedAdjectives).has(adj))
  const nounList = NOUNS.filter((noun) => !new Set(blockedNouns).has(noun))
  return `${chooseRandomWord(adjectiveList)} ${chooseRandomWord(nounList)}`
}
