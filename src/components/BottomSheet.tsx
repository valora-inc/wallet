import GorhomBottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useMemo } from 'react'
import { StyleSheet, Text } from 'react-native'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  title?: string | null
  description?: string | null
  children?: React.ReactNode | React.ReactNode[]
  onDismiss?: () => void
  testId: string
}

export type BottomSheetRefType = GorhomBottomSheet

const BottomSheet = ({ forwardedRef, title, description, children, onDismiss, testId }: Props) => {
  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], [])
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(initialSnapPoints)

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  const handleChangePosition = (index: number) => {
    if (index === -1) {
      onDismiss?.()
    }
  }

  return (
    <GorhomBottomSheet
      ref={forwardedRef}
      index={-1}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      onChange={handleChangePosition}
    >
      <BottomSheetScrollView handleContentLayout={handleContentLayout} testId={testId}>
        {title && <Text style={styles.title}>{title}</Text>}
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
