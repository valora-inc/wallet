import { map } from 'lodash'
import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import Times from 'src/icons/Times'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'
import { Vendor } from 'src/vendors/types'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'CashInBottomSheet'

type OwnProps = {
  vendor: Vendor
  dismiss: () => void
}

type Props = OwnProps

function VendorDetailBottomSheet({ vendor, dismiss }: Props) {
  const { title, siteURI, logoURI, tags } = vendor
  const [isModalVisible, setModalVisible] = useState(true)

  const userLocation = useSelector(userLocationDataSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)

  const onDismissBottomSheet = () => {
    dismiss()
  }

  const goToVendorSite = () => {
    onDismissBottomSheet()

    navigateToURI(siteURI)
    // ValoraAnalytics.track(FiatExchangeEvents.cico_add_funds_bottom_sheet_ramp_selected)
  }

  return (
    <Modal
      animationIn="slideInUp"
      animationInTiming={800}
      isVisible={isModalVisible}
      swipeDirection="down"
      style={styles.overlay}
      onBackdropPress={onDismissBottomSheet}
      onSwipeComplete={onDismissBottomSheet}
    >
      <View style={styles.container}>
        <Touchable
          style={styles.dismissButton}
          onPress={onDismissBottomSheet}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <Times />
        </Touchable>
        <>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{'Curacao Vendor'}</Text>
          <View style={styles.tags}>
            {map(tags, (tag) => (
              <Button
                type={BtnTypes.ONBOARDING_SECONDARY}
                size={BtnSizes.TINY}
                text={`${tag}`}
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
    paddingTop: 12,
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
  dismissButton: {
    backgroundColor: 'transparent',
    marginVertical: 26,
    marginRight: 26,
    alignItems: 'flex-end',
  },
  tags: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
})

export default VendorDetailBottomSheet
