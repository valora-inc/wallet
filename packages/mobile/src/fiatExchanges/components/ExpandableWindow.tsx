import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { StyleSheet, Text, View, ScrollView, Modal } from 'react-native'
import Touchable from '@celo/react-components/components/Touchable'

export interface ExpandableWindowProps {
  title: string
  onClose?: () => void
  children: React.ReactNode
}

export function ExpandableWindow({ title, onClose, children }: ExpandableWindowProps) {
  return (
    <Modal transparent={true} style={[styles.fullSize, styles.container]} animationType="fade">
      <View style={[styles.fullSize, styles.overlay]}>
        <Touchable borderless={true} onPress={onClose} style={[styles.fullSize]}>
          <View />
        </Touchable>
      </View>
      <View style={[styles.contentWrapper]}>
        <View style={[styles.content]}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={[styles.children]}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fullSize: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    zIndex: 9999,
  },
  overlay: {
    backgroundColor: colors.dark,
    opacity: 0.6,
  },
  contentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    paddingTop: 80,
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.light,
    paddingTop: 24,
    borderTopStartRadius: 16,
    borderTopEndRadius: 16,
  },
  children: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    ...fontStyles.h2,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
})
