import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-simple-toast'
import Touchable from 'src/components/Touchable'
import CopyIcon from 'src/icons/CopyIcon'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  label: string
  value: string
  testID: string
  onCopy?: () => void
}

function DataFieldWithCopy({ label, value, testID, onCopy }: Props) {
  const { t } = useTranslation()

  const handleCopy = () => {
    onCopy?.()

    Clipboard.setString(value)
    vibrateInformative()

    Toast.showWithGravity(
      t('walletConnectRequest.transactionDataCopied'),
      Toast.SHORT,
      Toast.BOTTOM
    )
  }

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.transactionDataContainer}>
        <Text style={styles.transactionDataLabel}>{label}</Text>
        <Text
          testID={`${testID}/Value`}
          style={fontStyles.small}
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
    ...fontStyles.small600,
    marginBottom: 4,
  },
})

export default DataFieldWithCopy
