import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { favoriteDappsWithCategoryNamesSelector } from 'src/dapps/selectors'
import { ActiveDapp, DappSection, DappV2 } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import { searchDappList } from 'src/dappsExplorer/searchDappList'
import NoResults from 'src/dappsExplorer/searchFilter/NoResults'
import StarIllustration from 'src/icons/StarIllustration'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  filterId: string
  filterName: string
  onPressDapp: (dapp: ActiveDapp) => void
  onShowSearchResult: (empty: boolean) => void
  removeFilter: () => void
  searchTerm: string
}

export function FavoriteDappsSection({
  filterId,
  filterName,
  onPressDapp,
  onShowSearchResult,
  removeFilter,
  searchTerm,
}: Props) {
  const { t } = useTranslation()
  const favoriteDappsWithCategoryNames = useSelector(favoriteDappsWithCategoryNamesSelector)
  const favoriteResultsFiltered = favoriteDappsWithCategoryNames.filter(
    (dapp) => dapp.categories.includes(filterId) || filterId === 'all'
  )
  const favoriteResults =
    searchTerm === ''
      ? favoriteResultsFiltered
      : (searchDappList(favoriteResultsFiltered, searchTerm) as DappV2[])

  useEffect(() => {
    if (favoriteResults.length > 0) {
      onShowSearchResult(false)
    } else {
      onShowSearchResult(true)
    }
  }, [favoriteResults, searchTerm, filterId])

  // Display favorites matching search and filter
  if (favoriteResults.length > 0) {
    return (
      <View testID="DAppsExplorerScreenSearchFilter/FavoriteDappsSection">
        {favoriteResults.map((favoriteDapp) => (
          <DappCard
            key={favoriteDapp.id}
            dapp={favoriteDapp}
            section={DappSection.FavoritesDappScreen}
            onPressDapp={onPressDapp}
          />
        ))}
      </View>
    )
    // Else if no favorites, display no favorites section
  } else if (
    favoriteDappsWithCategoryNames.length === 0 &&
    searchTerm === '' &&
    filterId === 'all'
  ) {
    return (
      <View style={styles.container}>
        <StarIllustration />
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{t('dappsScreen.noFavorites.title')}</Text>
          <Text style={styles.description}>{t('dappsScreen.noFavorites.description')}</Text>
        </View>
      </View>
    )
    // Else display no results section
  } else {
    return (
      <NoResults
        filterId={filterId}
        filterName={filterName}
        removeFilter={removeFilter}
        searchTerm={searchTerm}
        testID="FavoriteDappsSection/NoResults"
      />
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    marginTop: Spacing.Thick24,
  },
  contentContainer: {
    marginLeft: Spacing.Regular16,
    flex: 1,
  },
  title: {
    ...fontStyles.regular600,
    marginBottom: 4,
  },
  description: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
})

export default FavoriteDappsSection
