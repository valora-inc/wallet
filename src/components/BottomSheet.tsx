import GorhomBottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  title: string
  description?: string | null
  children?: React.ReactNode | React.ReactNode[]
  onClose?: () => void
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
  description,
  children,
  onClose,
  snapPoints,
  stickyTitle,
  stickyHeaderComponent,
  testId,
}: Props) => {
  const { height } = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

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
      onClose={onClose}
      maxDynamicContentSize={height - insets.top}
    >
      {hasStickyHeader && (
        <View style={[styles.stickyHeaderContainer, styles.headerContentSpacing]}>
          {stickyTitle && <Text style={styles.title}>{title}</Text>}
          {stickyHeaderComponent}
        </View>
      )}
      <BottomSheetScrollView
        containerStyle={hasStickyHeader ? { paddingTop: 0 } : undefined}
        testId={testId}
      >
        {!stickyTitle && <Text style={[styles.title, styles.headerContentSpacing]}>{title}</Text>}
        {description && <Text style={styles.description}>{description}</Text>}
        {children}
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  )
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: Colors.gray6,
    width: 40,
  },
  headerContentSpacing: {
    paddingBottom: Spacing.Small12,
  },
  stickyHeaderContainer: {
    padding: Spacing.Thick24,
  },
  title: {
    ...fontStyles.h2,
  },
  description: {
    ...fontStyles.small,
    marginBottom: Spacing.Smallest8,
  },
})

export default BottomSheet
