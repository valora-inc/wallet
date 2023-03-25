import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { favoriteDappsSelector } from 'src/dapps/selectors'
import { ActiveDapp, DappSection } from 'src/dapps/types'
import DappCard from 'src/dappsExplorer/DappCard'
import NoResultsSearch from 'src/dappsExplorer/NoResultsSearch'
import { calculateSearchScore } from 'src/dappsExplorer/utils'
import StarIllustration from 'src/icons/StarIllustration'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  onPressDapp: (dapp: ActiveDapp) => void
  searchQuery: string
  setFavoriteResultsEmpty: (empty: boolean) => void
}

export function FavoriteDappsSectionSearch({
  onPressDapp,
  searchQuery,
  setFavoriteResultsEmpty,
}: Props) {
  const { t } = useTranslation()
  const favoriteDapps = useSelector(favoriteDappsSelector)

  // Filter dapps that match the search query
  const favoritedDappsSearched = favoriteDapps.filter((dapp) =>
    calculateSearchScore(dapp, searchQuery)
  )
  // Sort these dapps by their search score
  favoritedDappsSearched.sort(
    (a, b) => calculateSearchScore(b, searchQuery) - calculateSearchScore(a, searchQuery)
  )

  useEffect(() => {
    if (favoritedDappsSearched.length > 0 && searchQuery !== '') {
      setFavoriteResultsEmpty(false)
    } else {
      setFavoriteResultsEmpty(true)
    }
  }, [favoritedDappsSearched])

  if (favoritedDappsSearched.length === 0 && searchQuery !== '') {
    return <NoResultsSearch testID="FavoriteDappsSectionSearch" searchQuery={searchQuery} />
  }

  if (favoritedDappsSearched.length > 0) {
    return (
      <View testID="DAppsExplorerScreenSearch/FavoriteDappsSectionSearch">
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

export default FavoriteDappsSectionSearch
