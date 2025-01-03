import React from 'react'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { DappExplorerEvents } from 'src/analytics/Events'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { favoriteDappIdsSelector } from 'src/dapps/selectors'
import { favoriteDapp, unfavoriteDapp } from 'src/dapps/slice'
import { Dapp, DappSection } from 'src/dapps/types'
import StarOutline from 'src/icons/StarOutline'
import Star from 'src/images/Star'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'

interface Props {
  onPressDapp: () => void
  dapp: Dapp
  testID: string
  disableFavoriting?: boolean
  onFavoriteDapp?: (dapp: Dapp) => void
  showBorder?: boolean
  cardContentContainerStyle?: ViewStyle
  cardStyle?: ViewStyle
}

// Since this icon exists within a touchable, make the hitslop bigger than usual
const favoriteIconHitslop = { top: 20, right: 20, bottom: 20, left: 20 }

function DappCard({
  dapp,
  onPressDapp,
  onFavoriteDapp,
  disableFavoriting,
  showBorder,
  cardContentContainerStyle,
  cardStyle,
  testID,
}: Props) {
  const dispatch = useDispatch()
  const favoriteDappIds = useSelector(favoriteDappIdsSelector)

  const isFavorited = favoriteDappIds.includes(dapp.id)

  const onPressFavorite = () => {
    const eventProperties = {
      categories: dapp.categories,
      dappId: dapp.id,
      dappName: dapp.name,
      section: DappSection.All,
    }

    if (isFavorited) {
      AppAnalytics.track(DappExplorerEvents.dapp_unfavorite, eventProperties)
      dispatch(unfavoriteDapp({ dappId: dapp.id }))
    } else {
      AppAnalytics.track(DappExplorerEvents.dapp_favorite, eventProperties)
      dispatch(favoriteDapp({ dappId: dapp.id }))
      onFavoriteDapp?.(dapp)
    }

    vibrateSuccess()
  }

  return (
    <Card
      testID={testID}
      style={[styles.card, showBorder ? styles.borderStyle : {}, cardStyle]}
      rounded={true}
      shadow={null}
    >
      <Touchable
        style={[styles.pressableCard, cardContentContainerStyle]}
        onPress={onPressDapp}
        borderRadius={8}
        testID={`Dapp/${dapp.id}`}
      >
        <>
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
    padding: Spacing.Regular16,
  },
  card: {
    padding: 0,
  },
  title: {
    ...typeScale.labelSemiBoldSmall,
    lineHeight: 24,
    color: Colors.black,
  },
  subtitle: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
})

export default DappCard
