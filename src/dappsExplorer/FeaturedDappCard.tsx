import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'

interface Props {
  dapp: Dapp
  onPressDapp: (dapp: ActiveDapp) => void
}

function FeaturedDappCard({ dapp, onPressDapp }: Props) {
  const onPress = () => onPressDapp({ ...dapp, openedFrom: DappSection.Featured })

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID="FeaturedDapp">
        <>
          <View style={styles.itemTextContainer}>
            <Text testID="FeaturedDapp/Name" style={styles.title}>
              {dapp.name}
            </Text>
            <Text style={styles.subtitle}>{dapp.description}</Text>
          </View>
          <Image source={{ uri: dapp.iconUrl }} style={styles.icon} />
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
  icon: {
    width: 106,
    height: 106,
    borderRadius: 53,
    marginLeft: Spacing.Small12,
  },
  title: {
    ...fontStyles.regular600,
    marginBottom: 5,
  },
  subtitle: {
    ...fontStyles.small,
    color: Colors.gray4,
  },
})

export default FeaturedDappCard
