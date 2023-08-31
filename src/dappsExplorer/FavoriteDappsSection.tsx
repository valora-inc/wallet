import React from 'react'
import { View } from 'react-native'
import { useSelector } from 'react-redux'
import { favoriteDappsWithCategoryNamesSelector } from 'src/dapps/selectors'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import { searchDappList } from 'src/dappsExplorer/searchDappList'

interface Props {
  filterId: string
  onPressDapp: (dapp: ActiveDapp, index: number) => void
  searchTerm: string
}

export function FavoriteDappsSection({ filterId, onPressDapp, searchTerm }: Props) {
  const favoriteDappsWithCategoryNames = useSelector(favoriteDappsWithCategoryNamesSelector)
  const favoriteResultsFiltered = favoriteDappsWithCategoryNames.filter(
    (dapp) => dapp.categories.includes(filterId) || filterId === 'all'
  )
  const favoriteResults =
    searchTerm === ''
      ? favoriteResultsFiltered
      : (searchDappList(favoriteResultsFiltered, searchTerm) as Dapp[])

  // Display favorites matching search and filter
  if (favoriteResults.length > 0) {
    return (
      <View testID="DAppsExplorerScreen/FavoriteDappsSection">
        {favoriteResults.map((favoriteDapp, index) => (
          <DappCard
            key={favoriteDapp.id}
            dapp={favoriteDapp}
            onPressDapp={() =>
              onPressDapp({ ...favoriteDapp, openedFrom: DappSection.FavoritesDappScreen }, index)
            }
          />
        ))}
      </View>
    )
  } else {
    return null
  }
}

export default FavoriteDappsSection
