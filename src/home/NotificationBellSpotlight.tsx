import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { notificationSpotlightSeen } from 'src/app/actions'
import Button, { BtnSizes } from 'src/components/Button'
import NotificationBell from 'src/home/NotificationBell'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  isVisible: boolean
}

const VERTICAL_TOP_BAR_OFFSET = 4
const HORIZONTAL_TOP_BAR_OFFSET = 4
const SPOTLIGHT_SIZE = 48
const ARROW_SIZE = 8

export default function NotificationBellSpotlight({ isVisible }: Props) {
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()

  const handleDismiss = () => {
    dispatch(notificationSpotlightSeen())
  }

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.7}
      style={styles.modal}
      useNativeDriverForBackdrop={true}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <NotificationBell
          style={[styles.bellContainer, { top: insets.top + VERTICAL_TOP_BAR_OFFSET }]}
        />
        <View
          style={[styles.arrow, { top: insets.top + VERTICAL_TOP_BAR_OFFSET + SPOTLIGHT_SIZE }]}
        />
        <View
          style={[
            styles.messageContainer,
            { top: insets.top + VERTICAL_TOP_BAR_OFFSET + SPOTLIGHT_SIZE + ARROW_SIZE * 2 },
          ]}
        >
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
    height: SPOTLIGHT_SIZE,
    width: SPOTLIGHT_SIZE,
    right: HORIZONTAL_TOP_BAR_OFFSET,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light,
  },
  arrow: {
    position: 'absolute',
    right: Spacing.Regular16 + HORIZONTAL_TOP_BAR_OFFSET,
    width: 0,
    height: 0,
    borderWidth: ARROW_SIZE,
    borderColor: 'transparent',
    borderBottomColor: Colors.light,
  },
  messageContainer: {
    width: '75%',
    position: 'absolute',
    right: HORIZONTAL_TOP_BAR_OFFSET,
    backgroundColor: Colors.light,
    borderRadius: 12,
    padding: Spacing.Regular16,
  },
  messageText: {
    ...fontStyles.small,
    marginBottom: Spacing.Small12,
  },
})
