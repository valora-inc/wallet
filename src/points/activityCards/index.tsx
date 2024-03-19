import React, { useRef } from 'react'
import Touchable from 'src/components/Touchable'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from 'src/styles/colors'
import CheckmarkWithCircle from 'src/icons/CheckmarkWithCircle'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'

interface Props {
  completed: boolean
  icon: React.ReactNode
  title: string
  points?: number
  pressable: boolean
  bottomSheetTitle?: string | null
  bottomSheetBody?: string | null
  bottomSheetCta?: string | null
  onCtaPress?: () => void
}

export default function ActivityCard({
  completed,
  icon,
  title,
  points,
  pressable,
  bottomSheetTitle,
  bottomSheetBody,
  bottomSheetCta,
  onCtaPress,
}: Props) {
  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const containerStyle = {
    ...styles.cardContainer,
    ...(completed ? { opacity: 0.5 } : {}),
  }

  const onPress = () => {
    console.log('haerkjasdkjashd')
    bottomSheetRef.current?.snapToIndex(0)
    console.log(bottomSheetRef.current)
  }

  const content = (
    <View style={containerStyle}>
      {completed && (
        <View style={styles.checkmarkIcon}>
          <CheckmarkWithCircle />
        </View>
      )}
      {icon}
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  )
  const renderCard = () => {
    if (pressable) {
      return (
        <Touchable style={styles.container} onPress={onPress}>
          {content}
        </Touchable>
      )
    } else {
      return <View style={styles.container}>{content}</View>
    }
  }
  return (
    <View style={styles.container}>
      {renderCard()}
      <BottomSheet forwardedRef={bottomSheetRef} testId={`PointsActivityBottomSheet/${title}`}>
        <View>
          <Text style={styles.bottomSheetTitle}>{bottomSheetTitle}</Text>
          <Text style={styles.bottomSheetBody}>{bottomSheetBody}</Text>
          <Button
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
            style={styles.bottomSheetButton}
            onPress={onCtaPress ?? (() => {})}
            text={bottomSheetCta}
          />
        </View>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexBasis: 0,
    borderRadius: Spacing.Regular16,
    margin: Spacing.Smallest8,
    backgroundColor: Colors.gray1,
    height: 96,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
  },
  bottomSheetBody: {
    ...typeScale.bodySmall,
  },
  bottomSheetButton: {},
  checkmarkIcon: {
    position: 'absolute',
    top: Spacing.Smallest8,
    right: 0,
  },
  cardTitle: {
    ...typeScale.labelXSmall,
    textAlign: 'center',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Regular16,
  },
})
