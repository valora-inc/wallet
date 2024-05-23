import GorhomBottomSheet from '@gorhom/bottom-sheet'
import React, { useRef } from 'react'
import { StyleSheet, Text, TextStyle, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import BottomSheetBase from 'src/components/BottomSheetBase'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
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
    ...fontStyles.small,
    marginBottom: Spacing.Smallest8,
  },
})

export default BottomSheet
