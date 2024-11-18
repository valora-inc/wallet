import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, Platform, StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function EnterAmountOptions({
  onPressAmount,
  selectedAmount,
}: {
  onPressAmount(amount: number): void
  selectedAmount: number | null
}) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  const amountOptions = useMemo(() => {
    return [
      {
        amount: 0.25,
        label: '25%',
      },
      {
        amount: 0.5,
        label: '50%',
      },
      {
        amount: 0.75,
        label: '75%',
      },
      {
        amount: 1,
        label: t('maxSymbol'),
      },
    ]
  }, [])

  useEffect(() => {
    // This component should ideally follow the keyboard animation, so it should
    // be visible before the keyboard is shown and dismissed. Sadly Android does
    // not support the keyboardWillShow or keyboardWillHide events.
    const keyboardShowEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const keyboardHideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'

    const showSubscription = Keyboard.addListener(keyboardShowEvent, () => {
      setVisible(true)
    })
    const hideSubscription = Keyboard.addListener(keyboardHideEvent, () => {
      setVisible(false)
    })

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
    }
  }, [])

  return (
    <View style={[styles.container, { opacity: visible ? 1 : 0 }]}>
      <View style={styles.contentContainer}>
        {amountOptions.map(({ amount, label }) => (
          <Touchable
            borderRadius={100}
            key={label}
            onPress={() => onPressAmount(amount)}
            disabled={!visible}
          >
            <View
              style={[
                styles.chip,
                { backgroundColor: selectedAmount === amount ? Colors.black : 'transparent' },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selectedAmount === amount ? Colors.white : Colors.black },
                ]}
              >
                {label}
              </Text>
            </View>
          </Touchable>
        ))}

        <Touchable
          onPress={() => {
            Keyboard.dismiss()
          }}
          disabled={!visible}
        >
          <View style={[styles.chip, { borderWidth: 0 }]}>
            <Text style={styles.chipText}>{t('done')}</Text>
          </View>
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.gray2,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: Spacing.Small12,
    paddingHorizontal: Spacing.Thick24,
    gap: Spacing.Smallest8,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 100,
    borderColor: Colors.black,
    paddingVertical: Spacing.Smallest8,
    paddingHorizontal: Spacing.Regular16,
  },
  chipText: {
    ...typeScale.labelSemiBoldXSmall,
  },
})
