import GorhomBottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useRef } from 'react'
import { Keyboard, ScrollView, StyleSheet, Text, TextStyle, View } from 'react-native'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  title?: string | null
  titleStyle?: TextStyle
  description?: string | null
  children?: React.ReactNode | React.ReactNode[]
  onClose?: () => void
  onOpen?: () => void
  snapPoints?: (string | number)[]
  stickyTitle?: boolean
  stickyHeaderComponent?: React.ReactNode
  testId: string
}

export type BottomSheetRefType = GorhomBottomSheet

// Note that dynamic sizing currently does not work well with sticky headers.
// The dynamic height in this case is always a little shorter than should be,
// however the content is scrollable and not obstructed. As a workaround,
// providing `snapPoints` is recommended when using sticky headers.
const BottomSheet = ({
  forwardedRef,
  title,
  titleStyle = fontStyles.h2,
  description,
  children,
  onClose,
  onOpen,
  snapPoints,
  stickyTitle,
  stickyHeaderComponent,
  testId,
}: Props) => {
  const { height } = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  // fires before bottom sheet animation starts
  const handleAnimate = (fromIndex: number, toIndex: number) => {
    if (toIndex === -1 || fromIndex === -1) {
      // ensure that the keyboard dismiss animation starts at the same time as
      // the bottom sheet
      Keyboard.dismiss()
    }

    if (toIndex === 0) {
      onOpen?.()
    }
  }

  const handleClose = () => {
    onClose?.()
    // reset scroll position after sheet is closed for the next time it is
    // reopened (the bottom sheet is not re-mounted on close, so we need to do
    // this manually)
    scrollViewRef.current?.scrollTo({ y: 0, animated: false })
  }

  const hasStickyHeader = stickyTitle || stickyHeaderComponent

  return (
    <GorhomBottomSheet
      ref={forwardedRef}
      index={-1}
      enableDynamicSizing={!snapPoints}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      onAnimate={handleAnimate}
      onClose={handleClose}
      maxDynamicContentSize={height - insets.top}
    >
      {hasStickyHeader && (
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
        {!stickyTitle && title && (
          <Text style={[titleStyle, styles.headerContentSpacing]}>{title}</Text>
        )}
        {description && <Text style={styles.description}>{description}</Text>}
        {children}
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  )
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: Colors.gray2,
    width: 40,
  },
  headerContentSpacing: {
    paddingBottom: Spacing.Small12,
  },
  stickyHeaderContainer: {
    padding: Spacing.Thick24,
  },
  description: {
    ...fontStyles.small,
    marginBottom: Spacing.Smallest8,
  },
})

export default BottomSheet
