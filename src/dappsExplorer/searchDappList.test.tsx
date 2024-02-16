import { DappWithCategoryNames } from 'src/dapps/types'
import { scoreDapp, searchDappList } from './searchDappList'

// Spanish translation of "Ubeswap"
const dappV2Ubeswap: DappWithCategoryNames = {
  name: 'Ubeswap',
  description: 'Intercambia tokens, entra a un fondo o participa del yield farming',
  dappUrl: 'https://app.ubeswap.org/',
  categories: ['exchanges', 'earn'],
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  id: 'ubeswap',
  categoryNames: ['Cambia', 'Gana'],
}

const dappV2Revo: DappWithCategoryNames = {
  name: 'Revo',
  description: 'Yield farming sencillo con protocolo de intereses compuestos automáticos',
  dappUrl: 'https://revo.market',
  categories: ['earn'],
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/revo.png',
  id: 'revo',
  categoryNames: ['Gana'],
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
    ${'Uniswap'}            | ${1.25}
    ${'participar'}         | ${0.625}
    ${''}                   | ${0}
  `(
    `Dapp: '${dappV2Ubeswap.name}' searchTerm: '$searchTerm' returns $expectedScore`,
    ({ searchTerm, expectedScore }) => {
      expect(scoreDapp(dappV2Ubeswap, searchTerm)).toBe(expectedScore)
    }
  )
})

describe('searchDappList', () => {
  it('returns an empty array if there are no dapps', () => {
    expect(searchDappList([], 'test')).toEqual([])
  })

  it('returns an empty array if there is no search term', () => {
    expect(searchDappList([dappV2Ubeswap, dappV2Revo], '')).toEqual([])
  })

  it('returns an empty array if there are no matches', () => {
    expect(searchDappList([dappV2Ubeswap, dappV2Revo], 'test')).toEqual([])
  })

  it.each`
    searchTerm                  | expectedResult
    ${'Ubeswap'}                | ${[dappV2Ubeswap]}
    ${'Cambia'}                 | ${[dappV2Ubeswap]}
    ${'Yield farming sencillo'} | ${[dappV2Revo, dappV2Ubeswap]}
    ${'Revo'}                   | ${[dappV2Revo]}
  `(`returns dapps that match the search term: '$searchTerm'`, ({ searchTerm, expectedResult }) => {
    expect(searchDappList([dappV2Ubeswap, dappV2Revo], searchTerm)).toEqual(expectedResult)
  })
})
