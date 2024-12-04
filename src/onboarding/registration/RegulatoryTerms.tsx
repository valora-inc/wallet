import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { acceptTerms } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import { withTranslation } from 'src/i18n'
import Logo from 'src/images/Logo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'

const MARGIN = 24

interface DispatchProps {
  acceptTerms: typeof acceptTerms
}
interface StateProps {
  recoveringFromStoreWipe: boolean
}

const mapDispatchToProps: DispatchProps = {
  acceptTerms,
}

const mapStateToProps = (state: RootState) => ({
  recoveringFromStoreWipe: recoveringFromStoreWipeSelector(state),
})

type Props = WithTranslation & DispatchProps & StateProps

export class RegulatoryTerms extends React.Component<Props> {
  static navigationOptions = {
    ...nuxNavigationOptions,
    ...Platform.select({
      ios: { animation: 'slide_from_bottom' },
    }),
  }

  links = getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.APP_CONFIG]).links

  onPressAccept = () => {
    AppAnalytics.track(OnboardingEvents.terms_and_conditions_accepted)

    this.props.acceptTerms()
    this.startOnboarding()
  }

  startOnboarding = () => {
    navigate(
      firstOnboardingScreen({
        recoveringFromStoreWipe: this.props.recoveringFromStoreWipe,
      })
    )
  }

  onPressGoToTerms = () => {
    navigateToURI(this.links.tos)
  }

  onPressGoToPrivacyPolicy = () => {
    navigateToURI(this.links.privacy)
  }

  renderTerms() {
    const { t } = this.props
    const pointsEnabled = getFeatureGate(StatsigFeatureGates.SHOW_POINTS)

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        testID="scrollView"
      >
        <Logo color={Colors.black} size={32} />
        <Text style={styles.title}>{t('terms.title')}</Text>
        <Text style={styles.disclaimer}>
          <Trans i18nKey={'terms.info'}>
            <Text onPress={this.onPressGoToTerms} style={styles.link} />
          </Trans>
        </Text>
        <Text style={styles.header}>{t('terms.heading1')}</Text>
        <Text style={styles.disclaimer}>
          <Trans i18nKey={'terms.privacy'}>
            <Text onPress={this.onPressGoToPrivacyPolicy} style={styles.link} />
          </Trans>
        </Text>
        <Text style={styles.header}>{t('terms.heading2')}</Text>
        <Text style={styles.disclaimer}>
          {pointsEnabled ? t('terms.goldDisclaimerWithPoints') : t('terms.goldDisclaimer')}
        </Text>
      </ScrollView>
    )
  }

  render() {
    const { t } = this.props

    return (
      <SafeAreaView
        style={styles.container}
        // don't apply safe area padding to top on iOS since it is opens like a
        // bottom sheet (modal animated screen)
        edges={Platform.select({ ios: ['bottom', 'left', 'right'] })}
      >
        <DevSkipButton nextScreen={Screens.PincodeSet} />
        {this.renderTerms()}
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <Button
              style={[styles.button, insets && insets.bottom <= MARGIN && { marginBottom: MARGIN }]}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              text={t('accept')}
              onPress={this.onPressAccept}
              testID={'AcceptTermsButton'}
            />
          )}
        </SafeAreaInsetsContext.Consumer>
      </SafeAreaView>
    )
  }
}

export default connect<{}, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>()(RegulatoryTerms))

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    marginTop: 40,
  },
  scrollContent: {
    paddingTop: 40,
    paddingHorizontal: MARGIN,
  },
  title: {
    ...typeScale.titleMedium,
    marginTop: 30,
    marginBottom: 24,
  },
  header: {
    ...typeScale.titleSmall,
    marginBottom: 10,
  },
  disclaimer: {
    ...typeScale.bodySmall,
    marginBottom: 15,
  },
  link: {
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: MARGIN,
    marginHorizontal: MARGIN,
  },
})
