import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import { ActiveDapp, Dapp, DappSection } from 'src/dapps/types'
import LinkArrow from 'src/icons/LinkArrow'
import { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'

interface Props {
  dapp: Dapp
  section: DappSection
  onPressDapp: (dapp: ActiveDapp) => void
}

function DappCard({ dapp, section, onPressDapp }: Props) {
  const onPress = () => onPressDapp({ ...dapp, openedFrom: section })

  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable style={styles.pressableCard} onPress={onPress} testID={`Dapp/${dapp.id}`}>
        <>
          <Image source={{ uri: dapp.iconUrl }} style={styles.dappIcon} />
          <View style={styles.itemTextContainer}>
            <Text style={styles.title}>{dapp.name}</Text>
            <Text style={styles.subtitle}>{dapp.description}</Text>
          </View>
          <LinkArrow size={24} />
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
