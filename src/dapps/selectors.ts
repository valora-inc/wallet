import { createSelector } from 'reselect'
import { DappCategory, DappV1, DappV2, isDappV2 } from 'src/dapps/types'
import { RootState } from 'src/redux/reducers'

export interface CategoryWithDapps extends DappCategory {
  dapps: Array<DappV1 | DappV2>
}

export const dappsListApiUrlSelector = (state: RootState) => state.dapps.dappListApiUrl

export const maxNumRecentDappsSelector = (state: RootState) => state.dapps.maxNumRecentDapps

export const recentDappIdsSelector = (state: RootState) => state.dapps.recentDappIds

export const activeDappSelector = (state: RootState) =>
  state.dapps.dappsWebViewEnabled ? state.dapps.activeDapp : null

export const dappsWebViewEnabledSelector = (state: RootState) => state.dapps.dappsWebViewEnabled

export const dappsCategoriesSelector = (state: RootState) => state.dapps.dappsCategories

export const dappsListSelector = (state: RootState) => state.dapps.dappsList

export const dappsV2ListSelector = (state: RootState) => state.dapps.dappsList.filter(isDappV2)

export const dappsListLoadingSelector = (state: RootState) => state.dapps.dappsListLoading

export const dappsListErrorSelector = (state: RootState) => state.dapps.dappsListError

export const featuredDappSelector = createSelector(dappsListSelector, (dapps) => {
  return dapps.find((dapp: DappV1 | DappV2) => dapp.isFeatured)
})

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
  favoriteDappIdsSelector,
  (dapps, categories, favoriteDappIds) => {
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
      // favorited dapps live in their own list, remove them from the "all" section in the dapps list
      // should always have a categoryId
      if (!isDappV2(dapp) && !favoriteDappIds.includes(dapp.id)) {
        mappedCategories[dapp.categoryId]?.dapps.push(dapp)
      }
      // DappV2 dapps can have multiple categories
      // And don't need to be removed form the all section as this is handled in DAppsExplorerScreen.tsx
      if (isDappV2(dapp)) {
        dapp.categories.forEach((category) => {
          mappedCategories[category]?.dapps.push(dapp)
        })
      }
    })

    return Object.values(mappedCategories).filter(isCategoryWithDapps)
  }
)

export const dappsCategoriesAlphabeticalSelector = createSelector(
  dappCategoriesSelector,
  (categories) => categories.slice(0).sort((a, b) => a.name.localeCompare(b.name))
)

export const dappConnectInfoSelector = (state: RootState) => state.dapps.dappConnectInfo

export const dappFavoritesEnabledSelector = (state: RootState) => state.dapps.dappFavoritesEnabled

export const dappsMinimalDisclaimerEnabledSelector = (state: RootState) =>
  state.dapps.dappsMinimalDisclaimerEnabled

export const recentDappsSelector = createSelector(
  dappsListSelector,
  recentDappIdsSelector,
  (dapps, recentDappIds) => {
    const recentDapps: Array<DappV1 | DappV2> = []
    recentDappIds.forEach((recentDappId) => {
      const recentDapp = dapps.find((dapp) => dapp.id === recentDappId)
      if (recentDapp) {
        recentDapps.push(recentDapp)
      }
    })
    return recentDapps
  }
)

export const favoriteDappsSelector = createSelector(
  dappsListSelector,
  favoriteDappIdsSelector,
  (dapps, favoriteDappIds) => dapps.filter((dapp) => favoriteDappIds.includes(dapp.id))
)

const nonFavoriteDappsSelector = createSelector(
  dappsV2ListSelector,
  favoriteDappIdsSelector,
  (dapps, favoriteDappIds) => dapps.filter((dapp) => !favoriteDappIds.includes(dapp.id))
)

function addCategoryNamesToDapps(dapps: Array<DappV2>, categories: Array<DappCategory>) {
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
  (dapps, categories) => addCategoryNamesToDapps(dapps.filter(isDappV2), categories)
)

export const dappListWithCategoryNamesSelector = createSelector(
  dappsV2ListSelector,
  dappsCategoriesSelector,
  (dapps, categories) => addCategoryNamesToDapps(dapps, categories)
)
