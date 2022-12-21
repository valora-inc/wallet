import { createSelector } from 'reselect'
import { Dapp, DappCategory } from 'src/dapps/types'
import { RootState } from 'src/redux/reducers'

export interface CategoryWithDapps extends DappCategory {
  dapps: Dapp[]
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

export const featuredDappSelector = createSelector(dappsListSelector, (dapps) => {
  return dapps.find((dapp) => dapp.isFeatured)
})

export const favoriteDappIdsSelector = (state: RootState) => state.dapps.favoriteDappIds

const isCategoryWithDapps = (
  category: CategoryWithDapps | undefined
): category is CategoryWithDapps => !!category && category.dapps.length > 0

export const dappCategoriesByIdSelector = createSelector(
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
      if (!favoriteDappIds.includes(dapp.id)) {
        mappedCategories[dapp.categoryId]?.dapps.push(dapp)
      }
    })

    return Object.values(mappedCategories).filter(isCategoryWithDapps)
  }
)

export const dappConnectInfoSelector = (state: RootState) => state.dapps.dappConnectInfo

export const dappFavoritesEnabledSelector = (state: RootState) => state.dapps.dappFavoritesEnabled

export const recentDappsSelector = createSelector(
  dappsListSelector,
  recentDappIdsSelector,
  (dapps, recentDappIds) => {
    const recentDapps: Dapp[] = []
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
  (dapps, favoriteDappIds) => {
    const favoriteDapps: Dapp[] = []
    favoriteDappIds.forEach((favoriteDappId) => {
      const favoriteDapp = dapps.find((dapp) => dapp.id === favoriteDappId)
      if (favoriteDapp) {
        favoriteDapps.push(favoriteDapp)
      }
    })
    return favoriteDapps
  }
)
