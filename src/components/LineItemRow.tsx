import * as React from 'react'
import { ActivityIndicator, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface LineItemProps {
  style?: ViewStyle
  textStyle?: TextStyle
  amount?: string | React.ReactNode
  title: string | React.ReactNode
  titleIcon?: React.ReactNode
  isLoading?: boolean
  hasError?: boolean
  testID?: string
}

export default function LineItemRow({
  style,
  textStyle: textStyleProp,
  amount,
  title,
  titleIcon,
  isLoading,
  hasError,
  testID,
}: LineItemProps) {
  const textStyle = [styles.text, textStyleProp]

  return (
    <View style={[styles.container, style]}>
      <View style={styles.description}>
        <Text testID={`LineItemRowTitle/${testID}`} style={textStyle}>
          {title}
        </Text>
        {titleIcon}
      </View>
      {!!amount && (
        <Text style={textStyle} testID={`LineItemRow/${testID}`}>
          {amount}
        </Text>
      )}
      {hasError && (
        <Text style={textStyle} testID={`LineItemRow/${testID}`}>
          ---
        </Text>
      )}
      {isLoading && (
        <View style={styles.loadingContainer} testID="LineItemLoading">
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    flexWrap: 'wrap',
  },
  description: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  text: {
    ...typeScale.labelMedium,
    color: colors.black,
  },
  loadingContainer: {
    transform: [{ scale: 0.7 }],
  },
})
