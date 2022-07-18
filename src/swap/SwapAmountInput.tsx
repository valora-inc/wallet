import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native'
import TextInput from 'src/components/TextInput'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/reducer'

interface Props {
  label: string
  onInputChange(value: string): void
  inputValue?: string | null
  onPressMax?(): void
  onSelectToken(): void
  token: TokenBalance
  autoFocus?: boolean
  style?: ViewStyle
}

const SwapAmountInput = ({
  label,
  onInputChange,
  inputValue,
  onPressMax,
  onSelectToken,
  token,
  autoFocus,
  style,
}: Props) => {
  const { t } = useTranslation()

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.contentContainer}>
        <TextInput
          onChangeText={onInputChange}
          value={inputValue || undefined}
          placeholder="0"
          style={styles.input}
          keyboardType="numeric"
          autoFocus={autoFocus}
        />
        {onPressMax && (
          <Touchable borderless onPress={onPressMax} style={styles.maxButton}>
            <Text style={styles.maxText}>{t('max')}</Text>
          </Touchable>
        )}
        <Touchable borderless onPress={onSelectToken} style={styles.tokenSelectButton}>
          <>
            <Image source={{ uri: token.imageUrl }} style={styles.tokenImage} />
            <Text style={styles.tokenName}>{token.symbol}</Text>
            <DownArrowIcon color={Colors.gray5} />
          </>
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Smallest8,
    backgroundColor: Colors.gray1,
    borderColor: Colors.gray2,
    borderWidth: 1,
  },
  label: {
    ...fontStyles.small,
    color: Colors.gray5,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
  },
  maxButton: {
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginHorizontal: Spacing.Smallest8,
  },
  maxText: {
    ...fontStyles.small,
    color: Colors.gray5,
    fontSize: 10,
  },
  tokenSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 100,
    padding: Spacing.Smallest8,
  },
  tokenName: {
    ...fontStyles.displayName,
    color: Colors.gray5,
    paddingHorizontal: 4,
  },
  tokenImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
})

export default SwapAmountInput
