import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Spacing } from 'src/styles/styles'
import Touchable from 'src/components/Touchable'
import { PasteAwareWrappedElementProps, withPasteAware } from 'src/components/WithPasteAware'
import Clipboard from 'src/icons/Clipboard'
import CircledIcon from 'src/icons/CircledIcon'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

type Props = PasteAwareWrappedElementProps

function PasteAddressButton(props: Props) {
  const { isPasteIconVisible, onPressPaste, clipboardContent } = props
  if (!isPasteIconVisible) {
    return null
  }
  const { t } = useTranslation()
  return (
    <View style={styles.wrapper}>
      <Touchable
        testID="PasteAddressButton"
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
