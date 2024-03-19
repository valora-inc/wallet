import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackParamList } from 'src/navigator/types'
import BackButton from 'src/components/BackButton'
import React, { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { PointsEvents } from 'src/analytics/Events'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Colors } from 'src/styles/colors'
import { SafeAreaView } from 'react-native-safe-area-context'
import ActivityCardSection from 'src/points/ActivityCardSection'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { BottomSheetDetails } from 'src/points/types'

type Props = NativeStackScreenProps<StackParamList, Screens.PointsHome>

export default function PointsHome({ route, navigation }: Props) {
  const { t } = useTranslation()

  // TODO: Use real points balance
  const pointsBalance = 50

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const [bottomSheetDetails, setBottomSheetDetails] = useState<BottomSheetDetails>({})
  const onCardPress = (bottomSheetDetails: BottomSheetDetails) => {
    setBottomSheetDetails(bottomSheetDetails)
  }
  useEffect(() => {
    if (bottomSheetDetails) {
      bottomSheetRef.current?.snapToIndex(0)
    }
  }, [bottomSheetDetails])

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{t('points.title')}</Text>
        </View>
        <View style={styles.balanceRow}>
          <Text style={styles.balance}>{pointsBalance}</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>{t('points.infoCard.title')}</Text>
          <Text style={styles.infoCardBody}>{t('points.infoCard.body')}</Text>
        </View>
        <ActivityCardSection onCardPress={onCardPress} />
      </ScrollView>
      <BottomSheet forwardedRef={bottomSheetRef} testId={`PointsActivityBottomSheet`}>
        <View style={styles.bottomSheetPointAmountContainer}>
          <Text style={styles.bottomSheetPointAmount}>{bottomSheetDetails.points}</Text>
        </View>
        <Text style={styles.bottomSheetTitle}>{bottomSheetDetails.bottomSheetTitle}</Text>
        <Text style={styles.bottomSheetBody}>{bottomSheetDetails.bottomSheetBody}</Text>
        <Button
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          onPress={
            bottomSheetDetails.onCtaPress ??
            (() => {
              /*fallback to empty fn*/
            })
          }
          text={bottomSheetDetails.bottomSheetCta}
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

PointsHome.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.PointsHome>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton eventName={PointsEvents.points_screen_back} />,
})

const styles = StyleSheet.create({
  container: {
    padding: Spacing.Thick24,
    paddingTop: 0,
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
  headerRow: {},
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
    paddingBottom: Spacing.Smallest8,
  },
})
