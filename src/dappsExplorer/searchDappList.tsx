import { get } from 'fast-levenshtein'
import { DappWithCategoryNames } from 'src/dapps/types'

const LEVENSHTEIN_THRESHOLD = 0.7 // levenshtein distance threshold

enum ScoreValues {
  High = 2.5,
  Medium = 1.25,
  Low = 0.625,
}

// Tokens are strings broken into lists of words by language agnostic regex
const getTokens = (text: string, preserveCasing = false) => {
  return preserveCasing
    ? text.match(/[\p{L}]+/gu) ?? []
    : text.toLowerCase().match(/[\p{L}]+/gu) ?? []
}

const getSimilarity = (a: string, b: string) => {
  const maxLength = Math.max(a.length, b.length)
  return 1 - get(a, b, { useCollator: true }) / maxLength
}

export const scoreDapp = (dapp: DappWithCategoryNames, searchTerm: string) => {
  let score = 0
  // Early return if there is no search term
  if (searchTerm === '') return score

  // Use a Map to keep take of the scores for each searchTerm
  const scoreMap = new Map<string, number>()
  const searchTokens = getTokens(searchTerm, true)
  const searchTokensLower = getTokens(searchTerm)
  const nameTokens = getTokens(dapp.name, true)
  const descriptionTokens = getTokens(dapp.description)
  // Lowercase categories as it was already an array of strings
  const categoryTokens = dapp.categoryNames.map((category) => category.toLowerCase())

  // Iterate through each word of and populate the scoreMap
  // Use the searchTokens (Casing Preserved) to check for exact matches
  for (const word of searchTokens) {
    // Name scoring
    if (nameTokens.some((token) => token.includes(word))) {
      scoreMap.set(word, scoreMap.get(word) ?? 0 + ScoreValues.High)
    } else {
      for (const token of nameTokens) {
        const similarity = getSimilarity(token, word)
        if (similarity >= LEVENSHTEIN_THRESHOLD) {
          scoreMap.set(word, (scoreMap.get(word) ?? 0) + ScoreValues.Medium)
        }
      }
    }
  }

  // Use the lowercase search tokens to score the description and categories
  for (const word of searchTokensLower) {
    // Description scoring
    if (descriptionTokens.some((token) => token.includes(word))) {
      scoreMap.set(word, scoreMap.get(word) ?? 0 + ScoreValues.Medium)
    } else {
      for (const token of descriptionTokens) {
        const similarity = getSimilarity(token, word)
        if (similarity >= LEVENSHTEIN_THRESHOLD) {
          scoreMap.set(word, (scoreMap.get(word) ?? 0) + ScoreValues.Low)
        }
      }
    }

    // Category scoring
    if (categoryTokens.some((token) => token.includes(word))) {
      scoreMap.set(word, scoreMap.get(word) ?? 0 + ScoreValues.Medium)
    } else {
      for (const token of categoryTokens) {
        const similarity = getSimilarity(token, word)
        if (similarity >= LEVENSHTEIN_THRESHOLD) {
          scoreMap.set(word, (scoreMap.get(word) ?? 0) + ScoreValues.Low)
        }
      }
    }
  }

  // Add the values from the map to the score
  for (const value of scoreMap.values()) {
    score += value
  }

  // Return the score
  // If search gets slow due to lots of dapps consider capping the score
  // and using a counting sort instead of a quicksort in searchDappList
  return score
}

export const searchDappList = (dappList: DappWithCategoryNames[], searchTerm: string) => {
  // A map of dapp id to score
  const dappResults: Record<string, number> = {}

  // Iterate through each dapp and score it populating the dappResults map with dapps that have a score > 0
  dappList.forEach((dapp) => {
    const score = scoreDapp(dapp, searchTerm)
    if (score > 0) {
      dappResults[dapp.id] = score
    }
  })

  // Convert the map to an array, sort it by score and convert it back to a list of dapps
  const dappResultsArray = Object.entries(dappResults).map(([id, score]) => ({ id, score }))
  dappResultsArray.sort((a, b) => b.score - a.score)
  const sortedDappList = dappResultsArray
    .map(({ id }) => dappList.find((dapp) => dapp.id === id))
    .filter((dapp): dapp is DappWithCategoryNames => dapp !== undefined)

  // Return the sorted list of dapps or an empty list if there are no results
  return sortedDappList ?? []
}
