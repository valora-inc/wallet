import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { notificationSpotlightSeen } from 'src/app/actions'
import Button, { BtnSizes } from 'src/components/Button'
import NotificationBell from 'src/home/NotificationBell'
import fontStyles from 'src/styles/fonts'

interface Props {
  isVisible: boolean
}

export default function NotificationBellSpotlight({ isVisible }: Props) {
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()

  const handleDismiss = () => {
    dispatch(notificationSpotlightSeen())
  }

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      style={styles.modal}
      useNativeDriverForBackdrop={true}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={[styles.bellContainer, { top: insets.top + 4 }]}>
          <NotificationBell />
        </View>
        <View style={[styles.arrow, { top: insets.top + 4 + 48 }]} />
        <View style={[styles.messageContainer, { top: insets.top + 4 + 48 + 16 }]}>
          <Text style={styles.messageText}>
            Introducing a new way to claim rewards, view alerts, and see updates in one place
          </Text>
          <Button
            onPress={handleDismiss}
            text="Got it"
            touchableStyle={{ minWidth: 30 }}
            style={{ alignSelf: 'flex-end' }}
            size={BtnSizes.SMALL}
          />
        </View>
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  bellContainer: {
    borderRadius: 100,
    position: 'absolute',
    height: 48,
    width: 48,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  arrow: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'transparent',
    width: 0,
    height: 0,
    borderWidth: 8,
    borderColor: 'transparent',
    borderBottomColor: 'white',
  },
  messageContainer: {
    width: '75%',
    position: 'absolute',
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'flex-end',
  },
  messageText: {
    ...fontStyles.small,
    marginBottom: 12,
  },
})
