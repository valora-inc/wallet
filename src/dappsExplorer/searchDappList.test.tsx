import { DappV2WithCategoryNames } from 'src/dapps/types'
import { scoreDapp } from './searchDappList'

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

describe('scoreDapp', () => {
  // Expected score is the sum of the scores:
  // nameMatchingCaseScore + nameScore + descriptionScore + categoryScore
  it.each`
    searchTerm              | expectedScore
    ${'Ubeswap'}            | ${2.5}
    ${'Cambia'}             | ${1.25}
    ${'swap'}               | ${2.5}
    ${'yield'}              | ${1.25}
    ${'Cómo puedo cambiar'} | ${0.625}
    ${'yield farming'}      | ${2.5}
    ${''}                   | ${0}
  `(
    `Dapp: '${dappV2.name}' searchTerm: '$searchTerm' returns $expectedScore`,
    ({ searchTerm, expectedScore }) => {
      expect(scoreDapp(dappV2, searchTerm)).toBe(expectedScore)
    }
  )
})
