import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import { PasteAwareWrappedElementProps, withPasteAware } from 'src/components/WithPasteAware'
import CircledIcon from 'src/icons/CircledIcon'
import Clipboard from 'src/icons/Clipboard'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = PasteAwareWrappedElementProps

function PasteAddressButton(props: Props) {
  const { isPasteIconVisible, onPressPaste, clipboardContent } = props
  const { t } = useTranslation()
  // TODO: We need to check clipboardContent here since for iOS 14+
  // isPasteIconVisible is set to true while clipboardContent is always null.
  if (!(isPasteIconVisible && clipboardContent)) {
    return null
  }
  return (
    <View style={styles.wrapper}>
      <Touchable
        testID="PasteAddressButton"
        borderRadius={10}
        style={styles.buttonContainer}
        onPress={onPressPaste}
      >
        <>
          <CircledIcon radius={40} backgroundColor={colors.gray1} borderColor={colors.gray2}>
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
    marginHorizontal: Spacing.Regular16,
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Small12,
    alignItems: 'center',
    borderRadius: 10,
  },
  textSection: {
    paddingLeft: Spacing.Regular16,
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  address: {
    ...typeScale.bodyXSmall,
    color: colors.gray4,
    flexWrap: 'wrap',
    flexShrink: 1,
    maxWidth: '100%',
  },
  title: {
    ...typeScale.labelSmall,
  },
})
