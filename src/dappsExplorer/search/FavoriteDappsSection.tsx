import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { favoriteDappsWithCategoryNamesSelector } from 'src/dapps/selectors'
import { ActiveDapp, DappSection } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import NoResults from 'src/dappsExplorer/search/NoResults'
import { calculateSearchScore } from 'src/dappsExplorer/utils'
import StarIllustration from 'src/icons/StarIllustration'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  onPressDapp: (dapp: ActiveDapp) => void
  searchTerm: string
  onShowSearchResult: (empty: boolean) => void
}

export function FavoriteDappsSection({ onPressDapp, searchTerm, onShowSearchResult }: Props) {
  const { t } = useTranslation()
  const favoriteDappsWithCategoryNames = useSelector(favoriteDappsWithCategoryNamesSelector)

  // Filter dapps that match the search query if present
  const favoritedDappsSearched = favoriteDappsWithCategoryNames.filter((dapp) =>
    searchTerm === '' ? true : calculateSearchScore(dapp, searchTerm)
  )

  // Sort these dapps by their search score
  favoritedDappsSearched.sort(
    (a, b) => calculateSearchScore(b, searchTerm) - calculateSearchScore(a, searchTerm)
  )

  useEffect(() => {
    if (favoritedDappsSearched.length > 0 && searchTerm !== '') {
      onShowSearchResult(false)
    } else {
      onShowSearchResult(true)
    }
  }, [favoritedDappsSearched, searchTerm])

  if (favoritedDappsSearched.length === 0 && searchTerm !== '') {
    return <NoResults testID="FavoriteDappsSection/NoResults" searchTerm={searchTerm} />
  }

  if (favoritedDappsSearched.length > 0) {
    return (
      <View testID="DAppsExplorerScreenSearch/FavoriteDappsSection">
        {favoritedDappsSearched.map((favoriteDapp) => (
          <DappCard
            key={favoriteDapp.id}
            dapp={favoriteDapp}
            section={DappSection.FavoritesDappScreen}
            onPressDapp={onPressDapp}
          />
        ))}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StarIllustration />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t('dappsScreen.noFavorites.title')}</Text>
        <Text style={styles.description}>{t('dappsScreen.noFavorites.description')}</Text>
      </View>
    </View>
  )
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
