import { isEmpty } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import ExchangeAssetField from 'src/swap/ExchangeAssetField'
import { fetchSelectedSwapAssets } from 'src/swap/reducer'
import { SwapDirection } from 'src/swap/types'

type Props = {
  defaultInputAsset?: any
  defaultOutputAsset?: any
  amountIn?: string
  amountOut?: string
  type: string
}

function ExchangeModal({ type }: Props) {
  const { t } = useTranslation()

  const { currentAssetIn, currentAssetOut, amountIn, amountOut } = useSelector(
    fetchSelectedSwapAssets
  )
  const disabled = isEmpty(currentAssetIn) || isEmpty(currentAssetOut) || !amountIn || !amountOut

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.panels}>
          <ExchangeAssetField
            style={styles.assetRow}
            asset={currentAssetIn}
            direction={SwapDirection.IN}
          />
          <ExchangeAssetField
            style={styles.assetRow}
            asset={currentAssetOut}
            direction={SwapDirection.OUT}
          />
        </View>
        <View style={styles.spacer} />
        <Button
          type={disabled ? BtnTypes.SECONDARY : BtnTypes.BRAND_SECONDARY}
          size={BtnSizes.FULL}
          disabled={disabled}
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
