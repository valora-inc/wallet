import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetProps } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback } from 'react'
import { Keyboard, StyleSheet } from 'react-native'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import Colors from 'src/styles/colors'

interface BottomSheetBaseProps {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  children?: React.ReactNode | React.ReactNode[]
  onChange?: BottomSheetProps['onChange']
  onClose?: () => void
  onOpen?: () => void
  snapPoints?: (string | number)[]
  handleComponent?: BottomSheetProps['handleComponent']
  backgroundStyle?: BottomSheetProps['backgroundStyle']
}

const BottomSheetBase = ({
  forwardedRef,
  children,
  onChange,
  onClose,
  onOpen,
  snapPoints,
  handleComponent,
  backgroundStyle,
}: BottomSheetBaseProps) => {
  const { height } = useSafeAreaFrame()
  const insets = useSafeAreaInsets()

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
  }

  return (
    <GorhomBottomSheet
      ref={forwardedRef}
      index={-1}
      enableDynamicSizing={!snapPoints}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleComponent={handleComponent}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={backgroundStyle}
      onAnimate={handleAnimate}
      onClose={handleClose}
      onChange={onChange}
      maxDynamicContentSize={height - insets.top}
    >
      {children}
    </GorhomBottomSheet>
  )
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: Colors.gray2,
    width: 40,
  },
})

export default BottomSheetBase
