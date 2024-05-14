import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import CustomHeader from 'src/components/header/CustomHeader'
import { pointsIllustration } from 'src/images/Images'
import { replace } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { pointsIntroDismissed } from 'src/points/slice'
import { useDispatch } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.PointsIntro>

export default function PointsHome({ route, navigation }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const onIntroDismiss = () => {
    ValoraAnalytics.track(PointsEvents.points_intro_dismiss)
    dispatch(pointsIntroDismissed())
    replace(Screens.PointsHome)
  }

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      ValoraAnalytics.track(PointsEvents.points_intro_back)
    })

    return unsubscribe
  }, [navigation])

  return (
    <SafeAreaView style={styles.outerContainer} edges={['top']}>
      <CustomHeader style={styles.header} left={<BackButton />} />
      <View style={styles.introContainer}>
        <View style={styles.introContent}>
          <Image style={styles.introImage} source={pointsIllustration} />
          <Text style={styles.introTitle}>{t('points.intro.title')}</Text>
          <Text style={styles.introDescription}>{t('points.intro.description')}</Text>
        </View>
        <Button onPress={onIntroDismiss} text={t('points.intro.cta')} size={BtnSizes.FULL} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    paddingBottom: Spacing.Thick24,
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  introContainer: {
    flex: 1,
    paddingHorizontal: Spacing.Thick24,
    paddingBottom: Spacing.Thick24,
  },
  introContent: {
    flex: 1,
    alignItems: 'center',
  },
  introImage: {
    marginBottom: Spacing.Regular16,
  },
  introTitle: {
    ...typeScale.titleLarge,
    color: Colors.black,
    textAlign: 'center',
  },
  introDescription: {
    ...typeScale.bodySmall,
    color: Colors.black,
    marginTop: Spacing.Regular16,
    textAlign: 'center',
  },
})
