import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Platform, ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { acceptTerms } from 'src/account/actions'
import { recoveringFromStoreWipeSelector } from 'src/account/selectors'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import { PRIVACY_LINK, TOS_LINK } from 'src/config'
import { withTranslation } from 'src/i18n'
import Logo from 'src/icons/Logo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { firstOnboardingScreen } from 'src/onboarding/steps'
import { RootState } from 'src/redux/reducers'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
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

  onPressAccept = () => {
    ValoraAnalytics.track(OnboardingEvents.terms_and_conditions_accepted)

    this.props.acceptTerms()
    this.startOnboarding()
  }

  startOnboarding = () => {
    const { onboardingNameScreenEnabled } = getExperimentParams(
      ExperimentConfigs[StatsigExperiments.CHOOSE_YOUR_ADVENTURE]
    )
    navigate(
      firstOnboardingScreen({
        onboardingNameScreenEnabled,
        recoveringFromStoreWipe: this.props.recoveringFromStoreWipe,
      })
    )
  }

  onPressGoToTerms = () => {
    navigateToURI(TOS_LINK)
  }

  onPressGoToPrivacyPolicy = () => {
    navigateToURI(PRIVACY_LINK)
  }

  render() {
    const { t } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <DevSkipButton nextScreen={Screens.NameAndPicture} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          testID="scrollView"
        >
          <Logo color={Colors.black} size={32} />
          <Text style={styles.title}>{t('terms.title')}</Text>
          <Text style={styles.disclaimer}>
            <Trans i18nKey={'terms.info'}>
              <Text onPress={this.onPressGoToTerms} style={styles.disclaimerLink} />
            </Trans>
          </Text>
          <Text style={styles.header}>{t('terms.heading1')}</Text>
          <Text style={styles.disclaimer}>
            <Trans i18nKey={'terms.privacy'}>
              <Text onPress={this.onPressGoToPrivacyPolicy} style={styles.disclaimerLink} />
            </Trans>
          </Text>
          <Text style={styles.header}>{t('terms.heading2')}</Text>
          <Text style={styles.disclaimer}>{t('terms.goldDisclaimer')}</Text>
        </ScrollView>
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <Button
              style={[styles.button, insets && insets.bottom <= MARGIN && { marginBottom: MARGIN }]}
              type={BtnTypes.ONBOARDING}
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
    ...fontStyles.h1,
    marginTop: 30,
    marginBottom: 24,
  },
  header: {
    ...fontStyles.h2,
    marginBottom: 10,
  },
  disclaimer: {
    ...fontStyles.small,
    marginBottom: 15,
  },
  disclaimerLink: {
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: MARGIN,
    marginHorizontal: MARGIN,
  },
})
