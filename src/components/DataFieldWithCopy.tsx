import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import Touchable from 'src/components/Touchable'
import CopyIcon from 'src/icons/CopyIcon'
import colors, { Colors } from 'src/styles/colors'
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
}

function DataFieldWithCopy({ label, value, copySuccessMessage, testID, onCopy }: Props) {
  const handleCopy = () => {
    onCopy?.()

    Clipboard.setString(value)
    vibrateInformative()

    Toast.showWithGravity(copySuccessMessage, Toast.SHORT, Toast.BOTTOM)
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.transactionDataContainer}>
        <Text style={styles.transactionDataLabel}>{label}</Text>
        <Text
          testID={`${testID}/Value`}
          style={styles.transactionData}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
      <Touchable hitSlop={variables.iconHitslop} onPress={handleCopy} testID={`${testID}/Copy`}>
        <CopyIcon />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Regular16,
    backgroundColor: colors.gray1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginTop: Spacing.Smallest8,
    marginBottom: Spacing.Large32,
  },
  transactionDataContainer: {
    flex: 1,
    marginRight: Spacing.Regular16,
  },
  transactionDataLabel: {
    ...typeScale.labelXSmall,
    color: Colors.black,
  },
  transactionData: {
    ...typeScale.bodyXSmall,
    color: Colors.black,
  },
})

export default DataFieldWithCopy
