import {
  dappCategoriesSelector,
  dappListWithCategoryNamesSelector,
  favoriteDappsWithCategoryNamesSelector,
} from 'src/dapps/selectors'
import { getMockStoreData } from 'test/utils'

const dapp1 = {
  name: 'Ubeswap',
  id: '1',
  categoryId: '1',
  description: 'Swap tokens!',
  iconUrl: 'https://raw.githubusercontent.com/valora-inc/app-list/main/assets/ubeswap.png',
  dappUrl: 'https://app.ubeswap.org/',
  isFeatured: false,
}
const dapp2 = {
  name: 'Moola',
  id: '2',
  categoryId: '2',
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
  it('should return categories with dapps', () => {
    expect(
      dappCategoriesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1, dapp2],
            dappsCategories,
          },
        })
      )
    ).toEqual([
      {
        ...dappsCategories[0],
        dapps: [dapp1],
      },
      {
        ...dappsCategories[1],
        dapps: [dapp2],
      },
    ])
  })
})

describe('favoriteDappsWithCategoryNamesSelector', () => {
  it('should return favorites with category names', () => {
    expect(
      favoriteDappsWithCategoryNamesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1, dapp2],
            dappsCategories,
            favoriteDappIds: [dapp1.id, dapp2.id],
          },
        })
      )
    ).toEqual([
      {
        ...dapp1,
        categoryName: dappsCategories[0].name,
      },
      {
        ...dapp2,
        categoryName: dappsCategories[1].name,
      },
    ])
  })
})

describe('dappListWithCategoryNamesSelector', () => {
  it('should return dapps with category names', () => {
    expect(
      dappListWithCategoryNamesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1, dapp2],
            dappsCategories,
          },
        })
      )
    ).toEqual([
      {
        ...dapp1,
        categoryName: dappsCategories[0].name,
      },
      {
        ...dapp2,
        categoryName: dappsCategories[1].name,
      },
    ])
  })
})
