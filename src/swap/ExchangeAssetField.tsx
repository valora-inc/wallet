import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import TextInputMask from 'react-native-text-input-mask'
import { useDispatch, useSelector } from 'react-redux'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { setSwapAssetAmount } from 'src/swap/actions'
import { fetchSelectedSwapAssets } from 'src/swap/reducer'
import TokenSelectionButton from 'src/swap/TokenSelectionButton'
import { SwapDirection } from 'src/swap/types'

type ExchangeFieldProps = {
  asset: any
  direction: SwapDirection
  style: any
}

const ExchangeAssetField = ({ asset, direction, style }: ExchangeFieldProps) => {
  // // @todo Get required display details for asset
  // // @todo Actions to interact with elements
  const dispatch = useDispatch()
  const { amountIn, amountOut } = useSelector(fetchSelectedSwapAssets)
  const amount = direction === SwapDirection.IN ? amountIn : amountOut

  const handleValue = (formatted: any) => {
    const res = Number(formatted)
    if (!Number.isNaN(res)) dispatch(setSwapAssetAmount(res, direction))
    else dispatch(setSwapAssetAmount(0, direction))
  }

  return (
    <View style={styles.assetRow} {...style}>
      <View style={styles.inputRow}>
        <View style={styles.inputAmounts}>
          <TextInputMask
            style={[styles.localInput, !amount ? styles.controlled : null]}
            onChangeText={handleValue}
            placeholder={'0'}
            placeholderTextColor={Colors.gray4}
            testID={`${direction}/Amount`}
            value={`${amount}`}
            keyboardType={'decimal-pad'}
            returnKeyType="done"
          />
          <Text style={[styles.localFiat, styles.controlled]}>$ {Number(0).toPrecision(3)}</Text>
        </View>
      </View>
      <View style={styles.assetButton}>
        <TokenSelectionButton asset={asset} direction={direction} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  assetRow: {
    minWidth: '100%',
    flexDirection: 'row',
  },
  assetButton: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    flexGrow: 1,
  },
  inputAmounts: {
    flexDirection: 'column',
  },
  localFiat: {
    ...fontStyles.regular,
  },
  localInput: {
    ...fontStyles.largeNumber,
  },
  controlled: {
    color: Colors.gray5,
  },
})

export default ExchangeAssetField
