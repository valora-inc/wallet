import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import React, { useCallback, useMemo } from 'react'
import { getNumberFormatSettings } from 'react-native-localize'
import { NUMBER_INPUT_MAX_DECIMALS } from 'src/config'

const { decimalSeparator } = getNumberFormatSettings()

interface Props {
  amount: string
  setAmount: (amount: string) => void
}

function AmountPadInput({ amount, setAmount }: Props) {
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
      setAmount(amount + digit.toString())
    },
    [amount, setAmount]
  )

  const onBackspacePress = useCallback(() => {
    setAmount(amount.substr(0, amount.length - 1))
  }, [amount, setAmount])

  const onDecimalPress = useCallback(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos !== -1) {
      return
    }

    if (!amount) {
      setAmount('0' + decimalSeparator)
    } else {
      setAmount(amount + decimalSeparator)
    }
  }, [amount, setAmount])

  return (
    <NumberKeypad
      onDigitPress={onDigitPress}
      onBackspacePress={onBackspacePress}
      decimalSeparator={decimalSeparator}
      onDecimalPress={onDecimalPress}
    />
  )
}

export default AmountPadInput
