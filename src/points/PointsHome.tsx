import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackParamList } from 'src/navigator/types'
import BackButton from 'src/components/BackButton'
import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Screens } from 'src/navigator/Screens'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Colors } from 'src/styles/colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import ActivityCardSection from 'src/points/ActivityCardSection'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { BottomSheetParams, PointsActivity } from 'src/points/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import CustomHeader from 'src/components/header/CustomHeader'

type Props = NativeStackScreenProps<StackParamList, Screens.PointsHome>

export default function PointsHome({ route, navigation }: Props) {
  const { t } = useTranslation()

  // TODO: Use real points balance
  const pointsBalance = 50

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const [bottomSheetParams, setBottomSheetParams] = useState<BottomSheetParams | undefined>(
    undefined
  )
  const onCardPress = (bottomSheetDetails: BottomSheetParams) => {
    setBottomSheetParams(bottomSheetDetails)
  }

  useEffect(() => {
    if (bottomSheetParams) {
      bottomSheetRef.current?.snapToIndex(0)
    }
  }, [bottomSheetParams])

  const onCtaPressWrapper = (onPress: () => void, activity: PointsActivity) => {
    return () => {
      ValoraAnalytics.track(PointsEvents.points_screen_card_cta_press, {
        activity,
      })
      onPress()
    }
  }
  return (
    <SafeAreaView style={styles.outerContainer} edges={['top']}>
      <CustomHeader
        style={styles.header}
        left={<BackButton eventName={PointsEvents.points_screen_back} />}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{t('points.title')}</Text>
        <View style={styles.balanceRow}>
          <Text style={styles.balance}>{pointsBalance}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>{t('points.infoCard.title')}</Text>
          <Text style={styles.infoCardBody}>{t('points.infoCard.body')}</Text>
        </View>
        <ActivityCardSection onCardPress={onCardPress} />
      </ScrollView>
      <BottomSheet
        snapPoints={['50%']}
        forwardedRef={bottomSheetRef}
        testId={`PointsActivityBottomSheet`}
      >
        {bottomSheetParams && (
          <>
            <View style={styles.bottomSheetPointAmountContainer}>
              <Text style={styles.bottomSheetPointAmount}>{bottomSheetParams.points}</Text>
            </View>
            <Text style={styles.bottomSheetTitle}>{bottomSheetParams.title}</Text>
            <Text style={styles.bottomSheetBody}>{bottomSheetParams.body}</Text>
            {bottomSheetParams.cta && (
              <Button
                testID={'PointsHomeBottomSheetCtaButton'}
                type={BtnTypes.PRIMARY}
                size={BtnSizes.FULL}
                onPress={onCtaPressWrapper(
                  bottomSheetParams.cta.onPress,
                  bottomSheetParams.activity
                )}
                text={bottomSheetParams.cta.text}
              />
            )}
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    paddingBottom: Spacing.Thick24,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: Spacing.Thick24,
    paddingTop: 0,
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  bottomSheetPointAmountContainer: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: Spacing.XLarge48,
    padding: Spacing.Smallest8,
  },
  bottomSheetPointAmount: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.successDark,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    marginVertical: Spacing.Regular16,
  },
  bottomSheetBody: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
    marginBottom: Spacing.XLarge48,
  },
  balanceRow: {
    paddingBottom: Spacing.Thick24,
  },
  balance: {
    ...typeScale.displaySmall,
  },
  infoCard: {
    backgroundColor: Colors.successLight,
    padding: Spacing.Regular16,
    marginBottom: Spacing.Thick24,
    borderRadius: 12,
  },
  infoCardTitle: {
    ...typeScale.labelSemiBoldMedium,
    paddingBottom: Spacing.Smallest8,
  },
  infoCardBody: {
    ...typeScale.bodyXSmall,
  },
  title: {
    ...typeScale.titleMedium,
    paddingVertical: Spacing.Smallest8,
  },
})
