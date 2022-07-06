import { map } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Modal from 'react-native-modal'
import { SendOrigin } from 'src/analytics/types'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import QRCodeBorderless from 'src/icons/QRCodeBorderless'
import Times from 'src/icons/Times'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Vendor } from 'src/vendors/types'

type OwnProps = {
  vendor: Vendor | null
  dismiss: () => void
  select: () => void
}

type Props = OwnProps

function VendorDetailBottomSheet({ vendor, dismiss, select }: Props) {
  const { t } = useTranslation()
  const { title, subtitle, tags, logoURI, address, description } = vendor || {}

  const recipient: Recipient = { address: address as string }

  const onDismissBottomSheet = () => {
    dismiss()
  }

  const navigateToSend = () => {
    navigate(Screens.SendAmount, { recipient, origin: SendOrigin.AppSendFlow })
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
        <View style={styles.innerContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.description}>{description}</Text>
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
          {/* @todo Add Send button */}
          <View style={styles.actionButtons}>
            {address && (
              <Button
                type={BtnTypes.PRIMARY}
                size={BtnSizes.MEDIUM}
                text={t('payVendor')}
                onPress={navigateToSend}
              />
            )}
            <TouchableOpacity onPress={select}>
              <QRCodeBorderless />
            </TouchableOpacity>
          </View>
          {/* @todo Add QR scanning button, this should utilize deep linking */}
        </View>
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
  innerContainer: {
    marginHorizontal: 20,
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
    marginBottom: 16,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'justify',
    fontSize: 14,
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
    marginVertical: 20,
  },
  actionButtons: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
})

export default VendorDetailBottomSheet
