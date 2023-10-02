import GorhomBottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback } from 'react'
import { StyleSheet, Text } from 'react-native'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  title: string
  description?: string | null
  children?: React.ReactNode | React.ReactNode[]
  testId: string
}

export type BottomSheetRefType = GorhomBottomSheet

const BottomSheet = ({ forwardedRef, title, description, children, testId }: Props) => {
  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  return (
    <GorhomBottomSheet
      ref={forwardedRef}
      index={-1}
      enableDynamicSizing
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView testId={testId}>
        <Text style={styles.title}>{title}</Text>
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
  title: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  description: {
    ...fontStyles.small,
    marginBottom: Spacing.Smallest8,
  },
})

export default BottomSheet
