import { DappV1, DappV2 } from 'src/dapps/types'
import { calculateSearchScore } from './utils'

const dappV1: DappV1 = {
  name: 'Ubeswap',
  description: 'Swap any token, enter a pool, or farm your crypto',
  dappUrl: 'https://app.ubeswap.org/',
  categoryId: 'exchanges',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  isFeatured: false,
  id: 'ubeswap',
}

const dappV2: DappV2 = {
  name: 'Ubeswap',
  description: 'Swap any token, enter a pool, or farm your crypto',
  dappUrl: 'https://app.ubeswap.org/',
  categories: ['exchanges'],
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/ubeswap.png',
  isFeatured: false,
  id: 'ubeswap',
}

describe('calculateSearchScore', () => {
  // Expected score is the sum of the scores:
  // nameMatchingCaseScore + nameScore + descriptionScore + categoryScore
  it.each`
    Dapp      | searchTerm    | expectedScore | dappVersion
    ${dappV1} | ${'Ubeswap'}  | ${3}          | ${1}
    ${dappV2} | ${'Ubeswap'}  | ${3}          | ${2}
    ${dappV1} | ${'exchange'} | ${1}          | ${1}
    ${dappV2} | ${'exchange'} | ${1}          | ${2}
    ${dappV1} | ${'swap'}     | ${4}          | ${1}
    ${dappV2} | ${'swap'}     | ${4}          | ${2}
    ${dappV1} | ${'pool'}     | ${1}          | ${1}
    ${dappV2} | ${'pool'}     | ${1}          | ${2}
  `(
    "dappVersion: $dappVersion Dapp: '$Dapp.name' searchTerm: '$searchTerm' returns $expectedScore",
    ({ Dapp, searchTerm, expectedScore }) => {
      expect(calculateSearchScore(Dapp, searchTerm)).toBe(expectedScore)
    }
  )
})
