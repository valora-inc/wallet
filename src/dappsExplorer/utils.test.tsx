import { DappV1WithCategoryName, DappV2WithCategoryNames } from 'src/dapps/types'
import { calculateSearchScore } from './utils'

// Spanish translation of "Ubeswap"
const dappV1: DappV1WithCategoryName = {
  name: 'Ubeswap',
  description: 'Intercambia tokens, entra a un fondo o participa del yield farming',
  dappUrl: 'https://app.ubeswap.org/',
  categoryId: 'exchanges',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  isFeatured: false,
  id: 'ubeswap',
  categoryName: 'Cambia',
}

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
    Dapp      | searchTerm   | expectedScore | dappVersion
    ${dappV1} | ${'Ubeswap'} | ${3}          | ${1}
    ${dappV2} | ${'Ubeswap'} | ${3}          | ${2}
    ${dappV1} | ${'Cambia'}  | ${2}          | ${1}
    ${dappV2} | ${'Cambia'}  | ${2}          | ${2}
    ${dappV1} | ${'swap'}    | ${3}          | ${1}
    ${dappV2} | ${'swap'}    | ${3}          | ${2}
    ${dappV1} | ${'yield'}   | ${1}          | ${1}
    ${dappV2} | ${'yield'}   | ${1}          | ${2}
    ${dappV1} | ${''}        | ${0}          | ${1}
    ${dappV2} | ${''}        | ${0}          | ${2}
  `(
    "dappVersion: $dappVersion Dapp: '$Dapp.name' searchTerm: '$searchTerm' returns $expectedScore",
    ({ Dapp, searchTerm, expectedScore }) => {
      expect(calculateSearchScore(Dapp, searchTerm)).toBe(expectedScore)
    }
  )
})
