import { map } from 'lodash'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import Times from 'src/icons/Times'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Vendor } from 'src/vendors/types'

type OwnProps = {
  vendor: Vendor | null
  dismiss: () => void
}

type Props = OwnProps

function VendorDetailBottomSheet({ vendor, dismiss }: Props) {
  const { title, tags } = vendor || {}

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
