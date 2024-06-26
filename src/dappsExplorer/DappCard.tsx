import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { favoriteDappIdsSelector } from 'src/dapps/selectors'
import { favoriteDapp, unfavoriteDapp } from 'src/dapps/slice'
import { Dapp, DappSection } from 'src/dapps/types'
import Star from 'src/icons/Star'
import StarOutline from 'src/icons/StarOutline'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'

interface DappCardContentProps {
  dapp: Dapp
  onFavoriteDapp?: (dapp: Dapp) => void
  favoritedFromSection: DappSection
  disableFavoriting?: boolean
  showBorder?: boolean
}

interface Props {
  onPressDapp: () => void
  dapp: Dapp
  testID: string
  disableFavoriting?: boolean
  onFavoriteDapp?: (dapp: Dapp) => void
  showBorder?: boolean
}

// Since this icon exists within a touchable, make the hitslop bigger than usual
const favoriteIconHitslop = { top: 20, right: 20, bottom: 20, left: 20 }

export function DappCardContent({
  dapp,
  onFavoriteDapp,
  favoritedFromSection,
  disableFavoriting,
  showBorder,
}: DappCardContentProps) {
  const dispatch = useDispatch()
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
    <View
      style={[
        styles.pressableCard,
        {
          paddingHorizontal: showBorder ? Spacing.Regular16 : Spacing.Smallest8,
        },
      ]}
    >
      <Image source={{ uri: dapp.iconUrl }} style={styles.dappIcon} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.title}>{dapp.name}</Text>
        <Text style={styles.subtitle}>{dapp.description}</Text>
      </View>
      <Touchable
        disabled={disableFavoriting}
        onPress={onPressFavorite}
        hitSlop={favoriteIconHitslop}
        testID={`Dapp/Favorite/${dapp.id}`}
      >
        {isFavorited ? <Star /> : !disableFavoriting ? <StarOutline /> : <></>}
      </Touchable>
    </View>
  )
}

function DappCard({
  dapp,
  onPressDapp,
  onFavoriteDapp,
  disableFavoriting,
  showBorder,
  testID,
}: Props) {
  return (
    <Card
      testID={testID}
      style={[styles.card, showBorder ? styles.borderStyle : {}]}
      rounded={true}
      shadow={null}
    >
      <Touchable onPress={onPressDapp} borderRadius={8} testID={`Dapp/${dapp.id}`}>
        <DappCardContent
          dapp={dapp}
          onFavoriteDapp={onFavoriteDapp}
          disableFavoriting={disableFavoriting}
          favoritedFromSection={DappSection.All}
          showBorder={showBorder}
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
  borderStyle: {
    borderWidth: 1,
    borderColor: Colors.gray2,
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
    paddingVertical: Spacing.Regular16,
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
