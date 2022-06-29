import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
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
  const { t } = useTranslation()
  const isDisabled = !(!!defaultInputAsset && !!defaultOutputAsset)

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
        <View style={styles.spacer} />
        <Button
          type={isDisabled ? BtnTypes.SECONDARY : BtnTypes.BRAND_SECONDARY}
          size={BtnSizes.FULL}
          disabled={isDisabled}
          text={t('swap.execute')}
          onPress={() => {}}
        />
      </View>
      <View>
        <Text style={styles.controlled}>Previous Swaps Here.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  assetRow: {
    marginVertical: 15,
  },
  spacer: {
    flexGrow: 1,
  },
  innerContainer: {
    flexGrow: 1,
  },
  panels: {},
  controlled: {
    textAlign: 'center',
    ...fontStyles.regular,
    color: Colors.gray4,
    marginTop: 10,
  },
})

export default ExchangeModal
