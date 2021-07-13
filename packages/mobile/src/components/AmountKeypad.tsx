import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import React, { useCallback, useMemo } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { NUMBER_INPUT_MAX_DECIMALS } from 'src/config'

const { decimalSeparator } = getNumberFormatSettings()

interface Props {
  amount: string
  onAmountChange: (amount: string) => void
}

function AmountKeypad({ amount, onAmountChange }: Props) {
  const maxLength = useMemo(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return null
    }
    return decimalPos + NUMBER_INPUT_MAX_DECIMALS + 1
  }, [amount, decimalSeparator])

  const onDigitPress = useCallback(
    (digit) => {
      if ((amount === '' && digit === 0) || (maxLength && amount.length + 1 > maxLength)) {
        return
      }
      onAmountChange(amount + digit.toString())
    },
    [amount, onAmountChange]
  )

  const onBackspacePress = useCallback(() => {
    onAmountChange(amount.substr(0, amount.length - 1))
  }, [amount, onAmountChange])

  const onDecimalPress = useCallback(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos !== -1) {
      return
    }

    if (!amount) {
      onAmountChange('0' + decimalSeparator)
    } else {
      onAmountChange(amount + decimalSeparator)
    }
  }, [amount, onAmountChange])

  return (
    <NumberKeypad
      onDigitPress={onDigitPress}
      onBackspacePress={onBackspacePress}
      decimalSeparator={decimalSeparator}
      onDecimalPress={onDecimalPress}
    />
  )
}

export default AmountKeypad
