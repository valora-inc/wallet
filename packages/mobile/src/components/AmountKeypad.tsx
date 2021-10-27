import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import React, { useCallback, useMemo } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'

const { decimalSeparator } = getNumberFormatSettings()

interface Props {
  amount: string
  maxDecimals: number
  onAmountChange: (amount: string) => void
}

function AmountKeypad({ amount, maxDecimals, onAmountChange }: Props) {
  const maxLength = useMemo(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return null
    }
    return decimalPos + maxDecimals + 1
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
