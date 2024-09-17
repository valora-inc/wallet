import { BottomSheetModal } from '@gorhom/bottom-sheet'
import React, { useRef } from 'react'
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import BottomSheetBase from 'src/components/BottomSheetBase'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  forwardedRef: React.RefObject<BottomSheetModal>
  title?: string | null
  titleStyle?: TextStyle
  description?: string | null
  children?: React.ReactNode | React.ReactNode[]
  onClose?: () => void
  onOpen?: () => void
  snapPoints?: (string | number)[]
  contentContainerStyle?: ViewStyle
  stickyTitle?: boolean
  stickyHeaderComponent?: React.ReactNode
  testId: string
}

export type BottomSheetModalRefType = BottomSheetModal

const BottomSheet = ({
  forwardedRef,
  title,
  titleStyle = typeScale.titleSmall,
  description,
  children,
  onClose,
  onOpen,
  snapPoints,
  stickyTitle,
  stickyHeaderComponent,
  testId,
}: Props) => {
  const scrollViewRef = useRef<ScrollView>(null)
  const hasStickyHeader = stickyTitle || stickyHeaderComponent

  return (
    <BottomSheetBase
      forwardedRef={forwardedRef}
      onClose={onClose}
      onOpen={onOpen}
      snapPoints={snapPoints}
    >
      {!!hasStickyHeader && (
        <View style={[styles.stickyHeaderContainer, styles.headerContentSpacing]}>
          {stickyTitle && <Text style={titleStyle}>{title}</Text>}
          {stickyHeaderComponent}
        </View>
      )}
      <BottomSheetScrollView
        forwardedRef={scrollViewRef}
        containerStyle={hasStickyHeader ? { paddingTop: 0 } : undefined}
        testId={testId}
      >
        {!stickyTitle && !!title && (
          <Text style={[titleStyle, styles.headerContentSpacing]}>{title}</Text>
        )}
        {!!description && <Text style={styles.description}>{description}</Text>}
        {children}
      </BottomSheetScrollView>
    </BottomSheetBase>
  )
}

const styles = StyleSheet.create({
  headerContentSpacing: {
    paddingBottom: Spacing.Small12,
  },
  stickyHeaderContainer: {
    padding: Spacing.Thick24,
  },
  description: {
    ...typeScale.bodySmall,
    marginBottom: Spacing.Smallest8,
  },
})

export default BottomSheet
