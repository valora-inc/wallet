import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { dappFavoritesEnabledSelector, favoriteDappIdsSelector } from 'src/dapps/selectors'
import { favoriteDapp, unfavoriteDapp } from 'src/dapps/slice'
import { Dapp, DappSection } from 'src/dapps/types'
import LinkArrow from 'src/icons/LinkArrow'
import Star from 'src/icons/Star'
import StarOutline from 'src/icons/StarOutline'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { Shadow, Spacing } from 'src/styles/styles'

interface DappCardContentProps {
  dapp: Dapp
  onFavoriteDapp?: (dapp: Dapp) => void
  favoritedFromSection: DappSection
}

interface Props {
  onPressDapp: () => void
  dapp: Dapp
  testID: string
  onFavoriteDapp?: (dapp: Dapp) => void
}

// Since this icon exists within a touchable, make the hitslop bigger than usual
const favoriteIconHitslop = { top: 20, right: 20, bottom: 20, left: 20 }

export function DappCardContent({
  dapp,
  onFavoriteDapp,
  favoritedFromSection,
}: DappCardContentProps) {
  const dispatch = useDispatch()
  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)
  const favoriteDappIds = useSelector(favoriteDappIdsSelector)

  const isFavorited = favoriteDappIds.includes(dapp.id)

  const onPressFavorite = () => {
    const eventProperties = {
      categories: dapp.categories,
      dappId: dapp.id,
      dappName: dapp.name,
      section: favoritedFromSection,
    }

    if (isFavorited) {
      ValoraAnalytics.track(DappExplorerEvents.dapp_unfavorite, eventProperties)
      dispatch(unfavoriteDapp({ dappId: dapp.id }))
    } else {
      ValoraAnalytics.track(DappExplorerEvents.dapp_favorite, eventProperties)
      dispatch(favoriteDapp({ dappId: dapp.id }))
      onFavoriteDapp?.(dapp)
    }

    vibrateSuccess()
  }

  return (
    <View style={styles.pressableCard}>
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
    </View>
  )
}

function DappCard({ dapp, onPressDapp, onFavoriteDapp, testID }: Props) {
  return (
    <Card testID={testID} style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable onPress={onPressDapp} borderRadius={8} testID={`Dapp/${dapp.id}`}>
        <DappCardContent
          dapp={dapp}
          onFavoriteDapp={onFavoriteDapp}
          favoritedFromSection={DappSection.All}
        />
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
    padding: Spacing.Regular16,
  },
  card: {
    marginTop: Spacing.Regular16,
    padding: 0,
  },
  title: {
    ...fontStyles.small500,
    lineHeight: 24,
    color: Colors.black,
  },
  subtitle: {
    ...fontStyles.xsmall,
    color: Colors.gray5,
  },
})

export default DappCard
