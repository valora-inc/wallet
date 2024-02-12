import { createSelector } from 'reselect'
import { Dapp, DappCategory } from 'src/dapps/types'
import { RootState } from 'src/redux/reducers'

export interface CategoryWithDapps extends DappCategory {
  dapps: Dapp[]
}

function getDappsById(dapps: Dapp[], dappIds: string[]) {
  const matchingDapps: Dapp[] = []
  dappIds.forEach((id) => {
    const matchedDapp = dapps.find((dapp) => dapp.id === id)
    if (matchedDapp) {
      matchingDapps.push(matchedDapp)
    }
  })
  return matchingDapps
}

export const dappsListApiUrlSelector = (state: RootState) => state.dapps.dappListApiUrl

export const maxNumRecentDappsSelector = (state: RootState) => state.dapps.maxNumRecentDapps

export const recentDappIdsSelector = (state: RootState) => state.dapps.recentDappIds

export const activeDappSelector = (state: RootState) =>
  state.dapps.dappsWebViewEnabled ? state.dapps.activeDapp : null

export const dappsWebViewEnabledSelector = (state: RootState) => state.dapps.dappsWebViewEnabled

export const dappsCategoriesSelector = (state: RootState) => state.dapps.dappsCategories

export const dappsListSelector = (state: RootState) => state.dapps.dappsList

export const dappsListLoadingSelector = (state: RootState) => state.dapps.dappsListLoading

export const dappsListErrorSelector = (state: RootState) => state.dapps.dappsListError

export const favoriteDappIdsSelector = (state: RootState) => state.dapps.favoriteDappIds

const isCategoryWithDapps = (
  category: CategoryWithDapps | undefined
): category is CategoryWithDapps => !!category && category.dapps.length > 0

/**
 * Returns a list of categories with dapps
 */
export const dappCategoriesSelector = createSelector(
  dappsListSelector,
  dappsCategoriesSelector,
  (dapps, categories) => {
    const mappedCategories: {
      [id: string]: CategoryWithDapps | undefined
    } = {}

    categories.forEach((cat: any) => {
      mappedCategories[cat.id] = {
        id: cat.id,
        name: cat.name,
        fontColor: cat.fontColor,
        backgroundColor: cat.backgroundColor,
        dapps: [],
      }
    })
    dapps.forEach((dapp) => {
      dapp.categories.forEach((category) => {
        mappedCategories[category]?.dapps.push(dapp)
      })
    })

    return Object.values(mappedCategories).filter(isCategoryWithDapps)
  }
)

export const dappsCategoriesAlphabeticalSelector = createSelector(
  dappCategoriesSelector,
  (categories) => categories.slice(0).sort((a, b) => a.name.localeCompare(b.name))
)

const mostPopularDappIdsSelector = (state: RootState) => state.dapps.mostPopularDappIds

export const mostPopularDappsSelector = createSelector(
  dappsListSelector,
  mostPopularDappIdsSelector,
  (dapps, mostPopularDappIds) => {
    return getDappsById(dapps, mostPopularDappIds)
  }
)

export const recentDappsSelector = createSelector(
  dappsListSelector,
  recentDappIdsSelector,
  (dapps, recentDappIds) => {
    return getDappsById(dapps, recentDappIds)
  }
)

export const favoriteDappsSelector = createSelector(
  dappsListSelector,
  favoriteDappIdsSelector,
  (dapps, favoriteDappIds) => dapps.filter((dapp) => favoriteDappIds.includes(dapp.id))
)

const nonFavoriteDappsSelector = createSelector(
  dappsListSelector,
  favoriteDappIdsSelector,
  (dapps, favoriteDappIds) => dapps.filter((dapp) => !favoriteDappIds.includes(dapp.id))
)

function addCategoryNamesToDapps(dapps: Array<Dapp>, categories: Array<DappCategory>) {
  const categoryMap: Record<string, string> = {}

  categories.forEach((category) => {
    categoryMap[category.id] = category.name
  })
  return dapps.map((dapp) => {
    return {
      ...dapp,
      categoryNames: dapp.categories.map((id) => categoryMap[id]),
    }
  })
}

export const nonFavoriteDappsWithCategoryNamesSelector = createSelector(
  nonFavoriteDappsSelector,
  dappsCategoriesSelector,
  (dapps, categories) => addCategoryNamesToDapps(dapps, categories)
)

export const favoriteDappsWithCategoryNamesSelector = createSelector(
  favoriteDappsSelector,
  dappsCategoriesSelector,
  (dapps, categories) => addCategoryNamesToDapps(dapps, categories)
)

export const dappListWithCategoryNamesSelector = createSelector(
  dappsListSelector,
  dappsCategoriesSelector,
  (dapps, categories) => addCategoryNamesToDapps(dapps, categories)
)
