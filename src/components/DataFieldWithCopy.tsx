import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native'
import Toast from 'react-native-simple-toast'
import Touchable from 'src/components/Touchable'
import CopyIcon from 'src/icons/CopyIcon'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  label: string
  value: string
  copySuccessMessage: string
  testID: string
  onCopy?: () => void
  style?: StyleProp<ViewStyle>
}

function DataFieldWithCopy({ label, value, copySuccessMessage, testID, onCopy, style }: Props) {
  const handleCopy = () => {
    onCopy?.()

    Clipboard.setString(value)
    vibrateInformative()

    Toast.showWithGravity(copySuccessMessage, Toast.SHORT, Toast.BOTTOM)
  }

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={styles.transactionDataLabel}>{label}</Text>
      <View style={styles.transactionDataContainer}>
        <Text
          testID={`${testID}/Value`}
          style={styles.transactionData}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
        <Touchable hitSlop={variables.iconHitslop} onPress={handleCopy} testID={`${testID}/Copy`}>
          <CopyIcon color={Colors.gray4} />
        </Touchable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    backgroundColor: Colors.gray1,
    marginTop: Spacing.Smallest8,
    marginBottom: Spacing.Large32,
  },
  transactionDataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.Large32,
  },
  transactionDataLabel: {
    ...typeScale.labelXSmall,
    color: Colors.black,
    marginBottom: Spacing.Smallest8,
  },
  transactionData: {
    ...typeScale.bodyMedium,
    color: Colors.black,
    flex: 1,
  },
})

export default DataFieldWithCopy
