import { DappV1, DappV2, isDappV2 } from 'src/dapps/types'

export const calculateSearchScore = (dapp: DappV2 | DappV1, searchQuery: string) => {
  const nameMatchingCaseScore = dapp.name.includes(searchQuery) ? 2 : 0
  const nameScore = dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0
  const descriptionScore = dapp.description.toLowerCase().includes(searchQuery.toLowerCase())
    ? 1
    : 0
  const categoryScore = isDappV2(dapp)
    ? dapp.categories.some((category) => category.toLowerCase().includes(searchQuery.toLowerCase()))
      ? 1
      : 0
    : dapp.categoryId.toLowerCase().includes(searchQuery.toLowerCase())
    ? 1
    : 0
  return nameMatchingCaseScore + nameScore + descriptionScore + categoryScore
}
