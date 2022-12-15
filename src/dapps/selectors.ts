import { createSelector } from 'reselect'
import { Dapp, DappCategory } from 'src/dapps/types'
import { RootState } from 'src/redux/reducers'

export interface CategoryWithDapps extends DappCategory {
  dapps: Dapp[]
}

export const dappsListApiUrlSelector = (state: RootState) => state.dapps.dappListApiUrl

export const maxNumRecentDappsSelector = (state: RootState) => state.dapps.maxNumRecentDapps

export const recentDappsSelector = (state: RootState) => state.dapps.recentDapps

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

const isCategoryWithDapps = (
  category: CategoryWithDapps | undefined
): category is CategoryWithDapps => typeof category !== undefined

export const dappCategoriesByIdSelector = createSelector(
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
      mappedCategories[dapp.categoryId]?.dapps.push(dapp)
    })
    return Object.values(mappedCategories).filter(isCategoryWithDapps)
  }
)

export const dappConnectInfoSelector = (state: RootState) => state.dapps.dappConnectInfo

export const dappFavoritesEnabledSelector = (state: RootState) => state.dapps.dappFavoritesEnabled
