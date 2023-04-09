import { DappV2WithCategoryNames } from 'src/dapps/types'
import { scoreDapp, searchDappList } from './searchDappList'

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
    ${'Uniswap'}            | ${1.25}
    ${'participar'}         | ${0.625}
    ${''}                   | ${0}
  `(
    `Dapp: '${dappV2.name}' searchTerm: '$searchTerm' returns $expectedScore`,
    ({ searchTerm, expectedScore }) => {
      expect(scoreDapp(dappV2, searchTerm)).toBe(expectedScore)
    }
  )
})

describe('searchDappList', () => {
  it('returns an empty array if there are no dapps', () => {
    expect(searchDappList([], 'test')).toEqual([])
  })

  it('returns an empty array if there is no search term', () => {
    expect(searchDappList([dappV2], '')).toEqual([])
  })

  it('returns an empty array if there are no matches', () => {
    expect(searchDappList([dappV2], 'test')).toEqual([])
  })

  it.each`
    searchTerm
    ${'Ubeswap'}
    ${'Cambia'}
  `('returns an array of dapps that match the search term', ({ searchTerm }) => {
    expect(searchDappList([dappV2], searchTerm)).toEqual([dappV2])
  })
})
