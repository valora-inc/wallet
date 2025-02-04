import { DEEP_LINK_URL_SCHEME } from 'src/config'
import {
  dappCategoriesSelector,
  dappListWithCategoryNamesSelector,
  favoriteDappsWithCategoryNamesSelector,
} from 'src/dapps/selectors'
import { getMockStoreData } from 'test/utils'

const dapp1V2 = {
  name: 'Ubeswap',
  id: '1',
  categories: ['1'],
  description: 'Swap tokens!',
  iconUrl: 'https://raw.githubusercontent.com/app-list/main/assets/ubeswap.png',
  dappUrl: 'https://app.ubeswap.org/',
}

const dapp2V2 = {
  name: 'Moola',
  id: '2',
  categories: ['2'],
  description: 'Lend and borrow tokens!',
  iconUrl: 'https://raw.githubusercontent.com/app-list/main/assets/moola.png',
  dappUrl: `${DEEP_LINK_URL_SCHEME}://wallet/moolaScreen`,
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
  it('should return categories with dapps for $dappVersion', () => {
    expect(
      dappCategoriesSelector(
        getMockStoreData({
          dapps: {
            dappsList: [dapp1V2, dapp2V2],
            dappsCategories,
          },
        })
      )
    ).toEqual([
      {
        ...dappsCategories[0],
        dapps: [dapp1V2],
      },
      {
        ...dappsCategories[1],
        dapps: [dapp2V2],
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
