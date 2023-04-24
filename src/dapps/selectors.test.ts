import {
  dappCategoriesSelector,
  dappListWithCategoryNamesSelector,
  favoriteDappsWithCategoryNamesSelector,
} from 'src/dapps/selectors'
import { getMockStoreData } from 'test/utils'

const dapp1V1 = {
  name: 'Ubeswap',
  id: '1',
  categoryId: '1',
  description: 'Swap tokens!',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png',
  dappUrl: 'https://app.ubeswap.org/',
  isFeatured: false,
}

const dapp1V2 = {
  name: 'Ubeswap',
  id: '1',
  categories: ['1'],
  description: 'Swap tokens!',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png',
  dappUrl: 'https://app.ubeswap.org/',
  isFeatured: false,
}

const dapp2V1 = {
  name: 'Moola',
  id: '2',
  categoryId: '2',
  description: 'Lend and borrow tokens!',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/moola.png',
  dappUrl: 'celo://wallet/moolaScreen',
  isFeatured: false,
}

const dapp2V2 = {
  name: 'Moola',
  id: '2',
  categories: ['2'],
  description: 'Lend and borrow tokens!',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/moola.png',
  dappUrl: 'celo://wallet/moolaScreen',
  isFeatured: false,
}

const dappsCategories = [
  {
    id: '1',
    name: 'Swap',
    backgroundColor: '#DEF8EA',
    fontColor: '#1AB775',
  },
  {
    id: '2',
    name: 'Lend, Borrow & Earn',
    backgroundColor: '#DEF8F7',
    fontColor: '#07A0AE',
  },
]

describe('dappCategoriesSelector', () => {
  it.each`
    dappList              | dappVersion
    ${[dapp1V1, dapp2V1]} | ${'v1'}
    ${[dapp1V2, dapp2V2]} | ${'v2'}
  `('should return categories with dapps for $dappVersion', ({ dappList }) => {
    expect(
      dappCategoriesSelector(
        getMockStoreData({
          dapps: {
            dappsList: dappList,
            dappsCategories,
          },
        })
      )
    ).toEqual([
      {
        ...dappsCategories[0],
        dapps: [dappList[0]],
      },
      {
        ...dappsCategories[1],
        dapps: [dappList[1]],
      },
    ])
  })
})

describe('favoriteDappsWithCategoryNamesSelector', () => {
  it('should return empty array if no favorites', () => {
    expect(
      favoriteDappsWithCategoryNamesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1V2, dapp2V2],
            dappsCategories,
            favoriteDappIds: [],
          },
        })
      )
    ).toEqual([])
  })

  it('should return favorites with category names v2', () => {
    expect(
      favoriteDappsWithCategoryNamesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1V2, dapp2V2],
            dappsCategories,
            favoriteDappIds: [dapp1V2.id, dapp2V2.id],
          },
        })
      )
    ).toEqual([
      {
        ...dapp1V2,
        categoryNames: [dappsCategories[0].name],
      },
      {
        ...dapp2V2,
        categoryNames: [dappsCategories[1].name],
      },
    ])
  })
})

describe('dappListWithCategoryNamesSelector', () => {
  it('should return dapps with category names v2', () => {
    expect(
      dappListWithCategoryNamesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1V2, dapp2V2],
            dappsCategories,
          },
        })
      )
    ).toEqual([
      {
        ...dapp1V2,
        categoryNames: [dappsCategories[0].name],
      },
      {
        ...dapp2V2,
        categoryNames: [dappsCategories[1].name],
      },
    ])
  })
})
