import { useHeaderHeight } from '@react-navigation/elements'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { cancelCreateOrRestoreAccount } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Card from 'src/components/Card'
import Touchable from 'src/components/Touchable'
import CloudCheck from 'src/icons/CloudCheck'
import Lock from 'src/icons/Lock'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import { getOnboardingStepValues, onboardingPropsSelector } from 'src/onboarding/steps'
import useTypedSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.ImportSelect>

function ActionCard({
  title,
  description,
  icon,
  onPress,
}: {
  title: string
  description: string
  icon: React.ReactNode
  onPress?: () => void
}) {
  return (
    <Card style={styles.card} rounded={true} shadow={Shadow.SoftLight}>
      <Touchable borderRadius={8} style={styles.touchable} onPress={onPress}>
        <View style={styles.cardContent}>
          <View style={styles.topLine}>
            {icon}
            <Text style={styles.cardTitle}>{title}</Text>
          </View>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </Touchable>
    </Card>
  )
}

export default function ImportSelect({ navigation }: Props) {
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const { t } = useTranslation()
  const onboardingProps = useTypedSelector(onboardingPropsSelector)
  const { step, totalSteps } = getOnboardingStepValues(Screens.ImportSelect, onboardingProps)

  const handleNavigateBack = () => {
    dispatch(cancelCreateOrRestoreAccount())
    ValoraAnalytics.track(OnboardingEvents.restore_account_cancel)
    navigateClearingStack(Screens.Welcome)
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TopBarTextButtonOnboarding title={t('cancel')} onPress={handleNavigateBack} />
      ),
      headerTitle: () => (
        <HeaderTitleWithSubtitle
          testID="Header/RestoreSelect"
          title={t('importSelect.header')}
          subTitle={t('registrationSteps', { step, totalSteps })}
        />
      ),
      headerStyle: {
        backgroundColor: 'transparent',
      },
    })
  }, [navigation, step, totalSteps])

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        style={[headerHeight ? { marginTop: headerHeight } : undefined]}
      >
        <View style={styles.viewContainer}>
          <Text style={styles.screenTitle}>{t('importSelect.title')}</Text>
          <Text style={styles.screenDescription}>{t('importSelect.description')}</Text>
          <ActionCard
            title={t('importSelect.emailAndPhone.title')}
            description={t('importSelect.emailAndPhone.description')}
            icon={<CloudCheck />}
            onPress={() => {
              navigate(Screens.SignInWithEmail, { keylessBackupFlow: KeylessBackupFlow.Restore })
            }}
          />
          <ActionCard
            title={t('importSelect.recoveryPhrase.title')}
            description={t('importSelect.recoveryPhrase.description')}
            icon={<Lock />}
            onPress={() => {
              navigate(Screens.ImportWallet, { clean: true })
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

ImportSelect.navigationOptions = {
  ...nuxNavigationOptions,
  // Prevent swipe back on iOS, users have to explicitly press cancel
  gestureEnabled: false,
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    padding: 0,
  },
  cardContent: {
    padding: Spacing.Regular16,
  },
  cardDescription: {
    ...typeScale.bodySmall,
    marginLeft: 28,
  },
  cardTitle: {
    ...typeScale.labelMedium,
    color: colors.primary,
  },
  safeArea: {
    alignItems: 'center',
    justifyContent: 'space-between',
    flexGrow: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  screenDescription: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
  },
  screenTitle: {
    ...typeScale.titleSmall,
    marginTop: Spacing.Thick24,
    textAlign: 'center',
  },
  topLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  touchable: {
    overflow: 'hidden',
  },
  viewContainer: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
  },
})
