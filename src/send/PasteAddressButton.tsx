import React from 'react'
import { View, Text, StyleProp, ViewProps, ViewStyle, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import i18n from 'src/i18n'

import { Spacing } from 'src/styles/styles'
import { isAddressFormat } from 'src/account/utils'
import Touchable from 'src/components/Touchable'
import { PasteAwareWrappedElementProps, withPasteAware } from 'src/components/WithPasteAware'
import Clipboard from 'src/icons/Clipboard'
import CircledIcon from 'src/icons/CircledIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

type Props = PasteAwareWrappedElementProps

function PasteAddressButton(props: Props) {
  const { isPasteIconVisible, onPressPaste, clipboardContent } = props
  const { t } = useTranslation()
  if (!isPasteIconVisible) {
    return null
  }
  return (
    <View style={styles.wrapper}>
      <Touchable
        testID={'PasteAddressButton'}
        borderRadius={10}
        style={styles.buttonContainer}
        onPress={onPressPaste}
      >
        <>
          <CircledIcon radius={40} backgroundColor={colors.gray2}>
            <Clipboard />
          </CircledIcon>
          <View style={styles.textSection}>
            <Text style={styles.title}>{t('sendSelectRecipient.paste')}</Text>
            <Text style={styles.address}>{clipboardContent}</Text>
          </View>
        </>
      </Touchable>
    </View>
  )
}
const Wrapper = withPasteAware(PasteAddressButton)
export default Wrapper

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 10,
    backgroundColor: colors.gray1,
    marginVertical: Spacing.Small12,
    marginHorizontal: Spacing.Thick24,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  textSection: {
    paddingLeft: 15,
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    flexShrink: 1,
    wordBreak: 'break-all',
  },
  address: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    flexWrap: 'wrap',
    flexShrink: 1,
    wordBreak: 'break-all',
    maxWidth: '100%',
  },
  title: {
    ...typeScale.labelSmall,
  },
})
