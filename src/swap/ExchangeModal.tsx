import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import ExchangeAssetField from 'src/swap/ExchangeAssetField'
import { SwapDirection } from 'src/swap/types'

type Props = {
  defaultInputAsset?: any
  defaultOutputAsset?: any
  type: string
}

function ExchangeModal({ defaultInputAsset, defaultOutputAsset, type }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.panels}>
          <ExchangeAssetField
            style={styles.assetRow}
            asset={defaultInputAsset}
            direction={SwapDirection.IN}
          />
          <ExchangeAssetField
            style={styles.assetRow}
            asset={defaultOutputAsset}
            direction={SwapDirection.OUT}
          />
        </View>
      </View>
      <View>
        <Text style={styles.controlled}>Previous Swaps Here.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  assetRow: {
    marginVertical: 15,
  },
  innerContainer: {},
  panels: {},
  controlled: { ...fontStyles.regular, color: Colors.gray4 },
})

export default ExchangeModal
