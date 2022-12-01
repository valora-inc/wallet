import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

export interface RequestDetail {
  label: string
  value: string
  tapToCopy?: boolean
}

function RequestContentRow({ label, value, tapToCopy }: RequestDetail) {
  const { t } = useTranslation()

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Touchable
        onPress={() => {
          Clipboard.setString(value)
          Logger.showMessage(t('addressCopied'))
        }}
        testID="CopyAddressToClipboard"
        disabled={!tapToCopy}
        style={styles.value}
      >
        <>
          <Text style={styles.valueText} numberOfLines={1} ellipsizeMode="middle">
            {value}
          </Text>
          {tapToCopy && <Text style={[styles.valueText, styles.tapToCopy]}>{t('tapToCopy')}</Text>}
        </>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.Smallest8,
  },
  label: {
    ...fontStyles.small600,
    flex: 1,
  },
  value: {
    flex: 1,
  },
  valueText: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'right',
  },
  tapToCopy: {
    textDecorationLine: 'underline',
  },
})

export default RequestContentRow
