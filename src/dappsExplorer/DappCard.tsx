import React, { useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { dappFavoritesEnabledSelector } from 'src/dapps/selectors'
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
}

// Since this icon exists within a touchable, make the hitslop bigger than usual
const favoriteIconHitslop = { top: 20, right: 20, bottom: 20, left: 20 }

function DappCard({ dapp, section, onPressDapp }: Props) {
  // TODO replace this state with a selector
  const [isFavorited, setIsFavorited] = useState(false)

  const dappFavoritesEnabled = useSelector(dappFavoritesEnabledSelector)

  const onPress = () => {
    onPressDapp({ ...dapp, openedFrom: section })
  }

  const onPressFavorite = () => {
    // TODO replace with dispatch favourite dapp action
    setIsFavorited((prev) => !prev)
  }

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID={`Dapp/${dapp.id}`}>
        <>
          <Image source={{ uri: dapp.iconUrl }} style={styles.dappIcon} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.title}>{dapp.name}</Text>
            <Text style={styles.subtitle}>{dapp.description}</Text>
          </View>
          {dappFavoritesEnabled ? (
            <Touchable onPress={onPressFavorite} hitSlop={favoriteIconHitslop}>
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
