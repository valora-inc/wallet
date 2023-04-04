import { DappV2WithCategoryNames } from 'src/dapps/types'
import { calculateSearchScore } from './utils'

// Spanish translation of "Ubeswap"
const dappV2: DappV2WithCategoryNames = {
  name: 'Ubeswap',
  description: 'Intercambia tokens, entra a un fondo o participa del yield farming',
  dappUrl: 'https://app.ubeswap.org/',
  categories: ['exchanges', 'earn'],
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  isFeatured: false,
  id: 'ubeswap',
  categoryNames: ['Cambia', 'Gana'],
}

describe('calculateSearchScore', () => {
  // Expected score is the sum of the scores:
  // nameMatchingCaseScore + nameScore + descriptionScore + categoryScore
  it.each`
    searchTerm   | expectedScore
    ${'Ubeswap'} | ${3}
    ${'Cambia'}  | ${2}
    ${'swap'}    | ${3}
    ${'yield'}   | ${1}
    ${''}        | ${0}
  `(
    `Dapp: '${dappV2.name}' searchTerm: '$searchTerm' returns $expectedScore`,
    ({ searchTerm, expectedScore }) => {
      expect(calculateSearchScore(dappV2, searchTerm)).toBe(expectedScore)
    }
  )
})
