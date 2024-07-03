import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AppEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { MultichainBetaStatus, optMultichainBeta } from 'src/app/actions'
import { multichainBetaStatusSelector } from 'src/app/selectors'
import BetaTag from 'src/components/BetaTag'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { patchUpdateStatsigUser } from 'src/statsig'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function MultichainBeta() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const multichainBetaStatus = useSelector(multichainBetaStatusSelector)

  const onPressCta = async (optedIn: boolean) => {
    ValoraAnalytics.track(
      optedIn ? AppEvents.multichain_beta_opt_in : AppEvents.multichain_beta_opt_out
    )
    dispatch(optMultichainBeta(optedIn))
    await patchUpdateStatsigUser({
      custom: {
        multichainBetaStatus: optedIn
          ? MultichainBetaStatus.OptedIn
          : MultichainBetaStatus.OptedOut,
      },
    })
    navigateHome()
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <BetaTag />
        <Text style={styles.title}>{t('multichainBeta.title')}</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{t('multichainBeta.description1')}</Text>
          <Text style={styles.description}>{t('multichainBeta.description2')}</Text>
        </View>
        <View style={styles.ctaContainer}>
          <Button
            style={styles.cta}
            touchableStyle={styles.ctaTouchable}
            size={BtnSizes.FULL}
            text={t('multichainBeta.primaryCta')}
            onPress={() => onPressCta(true)}
            testID="MultichainBeta/OptIn"
            disabled={multichainBetaStatus !== MultichainBetaStatus.NotSeen}
            showLoading={multichainBetaStatus === MultichainBetaStatus.OptedIn}
          />
          <Button
            style={styles.cta}
            touchableStyle={styles.ctaTouchable}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.FULL}
            text={t('multichainBeta.secondaryCta')}
            onPress={() => onPressCta(false)}
            testID="MultichainBeta/OptOut"
            disabled={multichainBetaStatus !== MultichainBetaStatus.NotSeen}
            showLoading={multichainBetaStatus === MultichainBetaStatus.OptedOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

MultichainBeta.navigationOptions = {
  ...emptyHeader,
  headerRight: () => (
    <TextButton
      testID="MultichainBeta/ContactSupport"
      style={styles.supportButton}
      onPress={() => {
        ValoraAnalytics.track(AppEvents.multichain_beta_contact_support)
        navigate(Screens.SupportContact)
      }}
    >
      {i18n.t('contactSupport')}
    </TextButton>
  ),
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.Thick24,
    justifyContent: 'center',
  },
  title: {
    color: Colors.black,
    ...typeScale.titleSmall,
    marginVertical: Spacing.Regular16,
  },
  descriptionContainer: {
    gap: Spacing.Small12,
  },
  description: {
    color: Colors.black,
    ...typeScale.bodyMedium,
  },
  ctaContainer: {
    marginTop: Spacing.Thick24,
    flexDirection: 'row',
    gap: Spacing.Small12,
  },
  cta: {
    flexGrow: 1,
    flexBasis: 0,
  },
  ctaTouchable: {
    height: 56,
  },
  supportButton: {
    color: Colors.primary,
    ...typeScale.bodyMedium,
  },
})

export default MultichainBeta
