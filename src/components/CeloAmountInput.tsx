import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import { useSelector } from 'react-redux'
import TextInputWithButtons from 'src/components/TextInputWithButtons'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { tokensByCurrencySelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'

interface Props {
  inputContainerStyle?: ViewStyle
  inputStyle?: TextInputProps['style']
  celo: string
  onCeloChanged: (address: string) => void
  color?: string
  feeEstimate: BigNumber | undefined
}

export default function CeloAmountInput({
  inputContainerStyle,
  inputStyle,
  celo,
  onCeloChanged,
  color = colors.goldUI,
  feeEstimate,
}: Props) {
  const { t } = useTranslation()
  const tokensByCurrency = useSelector(tokensByCurrencySelector)

  const goldBalance = tokensByCurrency[Currency.Celo]?.balance

  const setMaxAmount = () => {
    if (goldBalance && feeEstimate) {
      const maxValue = new BigNumber(goldBalance).minus(feeEstimate)
      onCeloChanged(maxValue.isPositive() ? maxValue.toString() : '0')
    }
  }

  return (
    <TextInputWithButtons
      style={inputContainerStyle}
      inputStyle={inputStyle}
      placeholder={'0'}
      placeholderTextColor={colors.gray3}
      keyboardType={'decimal-pad'}
      autoCapitalize="words"
      onChangeText={onCeloChanged}
      value={celo}
      testID={'CeloAmount'}
    >
      {feeEstimate ? (
        <TouchableOpacity testID={'MaxAmount'} onPress={setMaxAmount}>
          <Text style={[styles.maxAmount, { color }]}>{t('maxSymbol')}</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <ActivityIndicator size="small" color={colors.goldUI} />
        </View>
      )}
    </TextInputWithButtons>
  )
}

const styles = StyleSheet.create({
  maxAmount: fontStyles.small600,
})
