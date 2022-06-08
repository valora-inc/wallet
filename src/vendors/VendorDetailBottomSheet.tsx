import { map } from 'lodash'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import Times from 'src/icons/Times'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Vendor } from 'src/vendors/types'

type OwnProps = {
  vendor: Vendor | null
  dismiss: () => void
}

type Props = OwnProps

function VendorDetailBottomSheet({ vendor, dismiss }: Props) {
  const { title, subtitle, tags, logoURI } = vendor || {}

  const onDismissBottomSheet = () => {
    dismiss()
  }

  return (
    <Modal
      animationIn="slideInUp"
      animationInTiming={800}
      isVisible={!!vendor}
      swipeDirection="down"
      style={styles.overlay}
      onBackdropPress={onDismissBottomSheet}
      onSwipeComplete={onDismissBottomSheet}
      testID={`Vendors/DetailSheet`}
    >
      <View style={styles.container}>
        <View style={styles.sheetHeader}>
          <View style={styles.sheetIcon}>
            <Image source={{ uri: logoURI }} style={styles.vendorIcon} />
          </View>
          <Touchable style={styles.sheetClose} onPress={onDismissBottomSheet}>
            <Times />
          </Touchable>
        </View>
        <>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.tags}>
            {map(tags, (tag) => (
              <Button
                type={BtnTypes.ONBOARDING_SECONDARY}
                size={BtnSizes.TINY}
                text={`${tag}`}
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onPress={() => {}}
              />
            ))}
          </View>
        </>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    minHeight: '30%',
    paddingBottom: 50,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: 'white',
  },
  title: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingHorizontal: 36,
    marginBottom: 16,
  },
  subtitle: {
    ...fontStyles.regular,
    textAlign: 'center',
    color: colors.gray5,
    paddingHorizontal: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
  },
  sheetIcon: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sheetClose: {
    padding: 13,
    position: 'absolute',
    right: 0,
  },
  vendorIcon: {
    marginTop: -35,
    resizeMode: 'contain',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderColor: Colors.gray4,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'white',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
})

export default VendorDetailBottomSheet
