import { BottomSheetBackdrop, BottomSheetModal, BottomSheetProps } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useEffect } from 'react'
import { Keyboard, StyleSheet } from 'react-native'
import { useReducedMotion } from 'react-native-reanimated'
import Colors from 'src/styles/colors'

interface BottomSheetBaseProps {
  forwardedRef: React.RefObject<BottomSheetModal>
  children?: React.ReactNode | React.ReactNode[]
  onClose?: () => void
  onOpen?: () => void
  onChange?: BottomSheetProps['onChange']
  snapPoints?: (string | number)[]
  handleComponent?: BottomSheetProps['handleComponent']
  backgroundStyle?: BottomSheetProps['backgroundStyle']
  handleIndicatorStyle?: BottomSheetProps['handleIndicatorStyle']
}

const BottomSheetBase = ({
  forwardedRef,
  children,
  onClose,
  onOpen,
  onChange,
  snapPoints,
  handleComponent,
  backgroundStyle,
  handleIndicatorStyle = styles.handle,
}: BottomSheetBaseProps) => {
  const reduceMotionEnabled = useReducedMotion()

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

  useEffect(() => {
    // Mount the modal on first render
    forwardedRef.current?.present()
  }, [])

  return (
    <BottomSheetModal
      ref={forwardedRef}
      index={-1}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleComponent={handleComponent}
      handleIndicatorStyle={handleIndicatorStyle}
      backgroundStyle={backgroundStyle}
      onAnimate={handleAnimate}
      onDismiss={onClose}
      onChange={onChange}
      enableOverDrag={false}
      animateOnMount={!reduceMotionEnabled}
      enableDismissOnClose={false}
      stackBehavior="push"
    >
      {children}
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: Colors.gray2,
    width: 40,
  },
})

export default BottomSheetBase
