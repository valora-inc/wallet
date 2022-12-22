import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { dappFavoritesEnabledSelector, favoriteDappIdsSelector } from 'src/dapps/selectors'
import { favoriteDapp, unfavoriteDapp } from 'src/dapps/slice'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import LinkArrow from 'src/icons/LinkArrow'
import Star from 'src/icons/Star'
import StarOutline from 'src/icons/StarOutline'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'

interface Props {
  dapp: Dapp
  section: DappSection
  onPressDapp: (dapp: ActiveDapp) => void
  onFavoriteDapp?: (dapp: Dapp) => void
}

// Since this icon exists within a touchable, make the hitslop bigger than usual
const favoriteIconHitslop = { top: 20, right: 20, bottom: 20, left: 20 }

function DappCard({ dapp, section, onPressDapp, onFavoriteDapp }: Props) {
  const dispatch = useDispatch()
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const favoriteDappIds = useSelector(favoriteDappIdsSelector)

  const isFavorited = favoriteDappIds.includes(dapp.id)

  const onPress = () => {
    onPressDapp({ ...dapp, openedFrom: section })
  }

  const onPressFavorite = () => {
    const eventProperties = {
      categoryId: dapp.categoryId,
      dappId: dapp.id,
      dappName: dapp.name,
    }

    if (isFavorited) {
      ValoraAnalytics.track(DappExplorerEvents.dapp_unfavorite, eventProperties)
      dispatch(unfavoriteDapp({ dappId: dapp.id }))
    } else {
      ValoraAnalytics.track(DappExplorerEvents.dapp_favorite, eventProperties)
      dispatch(favoriteDapp({ dappId: dapp.id }))
      onFavoriteDapp?.(dapp)
    }
  }

  return (
    <Card testID="DappCard" style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID={`Dapp/${dapp.id}`}>
        <>
          <Image source={{ uri: dapp.iconUrl }} style={styles.dappIcon} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.title}>{dapp.name}</Text>
            <Text style={styles.subtitle}>{dapp.description}</Text>
          </View>
          {dappFavoritesEnabled ? (
            <Touchable
              onPress={onPressFavorite}
              hitSlop={favoriteIconHitslop}
              testID={`Dapp/Favorite/${dapp.id}`}
            >
              {isFavorited ? <Star /> : <StarOutline />}
            </Touchable>
          ) : (
            <LinkArrow size={24} />
          )}
        </>
      </Touchable>
    </Card>
  )
}

const styles = StyleSheet.create({
  itemTextContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  dappIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: Spacing.Regular16,
  },
  pressableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  card: {
    marginTop: Spacing.Regular16,
    flex: 1,
    alignItems: 'center',
  },
  title: {
    ...fontStyles.small,
    color: Colors.dark,
  },
  subtitle: {
    ...fontStyles.small,
    color: Colors.gray5,
  },
})

export default DappCard
