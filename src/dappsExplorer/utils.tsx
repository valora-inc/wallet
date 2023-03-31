import { DappV1WithCategoryName, DappV2WithCategoryNames, isDappV2 } from 'src/dapps/types'

/***
 * Calculates a score based on the search term and dapp
 * - +2 if the name matches the search term in a case sensitive way
 * - +1 if the name matches the search term in a case insensitive way
 * - +1 if the description matches the search term in a case insensitive way
 * - +1 if the category matches the search term in a case insensitive way
 * @param dapp expects a dapp with a categoryName or categoryNames
 * @param searchTerm
 * @returns {number} the score of the dapp 0 - 5
 */
export const calculateSearchScore = (
  dapp: DappV1WithCategoryName | DappV2WithCategoryNames,
  searchTerm: string
) => {
  if (searchTerm === '') return 0
  const nameMatchingCaseScore = dapp.name.includes(searchTerm) ? 2 : 0
  const nameScore = dapp.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0
  const descriptionScore = dapp.description.toLowerCase().includes(searchTerm.toLowerCase()) ? 1 : 0
  const categoryScore = isDappV2(dapp)
    ? dapp.categoryNames.some((category) =>
        category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      ? 1
      : 0
    : dapp.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    ? 1
    : 0
  return nameMatchingCaseScore + nameScore + descriptionScore + categoryScore
}
