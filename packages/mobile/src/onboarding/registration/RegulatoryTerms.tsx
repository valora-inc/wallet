import { TransitionPresets } from '@react-navigation/stack'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaInsetsContext, SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { acceptTerms } from 'src/account/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DevSkipButton from 'src/components/DevSkipButton'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD, PRIVACY_LINK, TOS_LINK } from 'src/config'
import { withTranslation } from 'src/i18n'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import fontStyles from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'

const MARGIN = 24

interface DispatchProps {
  acceptTerms: typeof acceptTerms
}

const mapDispatchToProps: DispatchProps = {
  acceptTerms,
}

type Props = WithTranslation & DispatchProps

export class RegulatoryTerms extends React.Component<Props> {
  static navigationOptions = {
    ...nuxNavigationOptions,
    ...TransitionPresets.ModalTransition,
  }

  onPressAccept = () => {
    ValoraAnalytics.track(OnboardingEvents.terms_and_conditions_accepted)

    this.props.acceptTerms()
    this.goToNextScreen()
  }

  goToNextScreen = () => {
    navigate(Screens.NameAndPicture)
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
          <Logo type={LogoTypes.DARK} height={32} />
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
          <Text style={styles.disclaimer}>
            {t('terms.goldDisclaimer', { dailyLimitCUSD: DEFAULT_DAILY_PAYMENT_LIMIT_CUSD })}
          </Text>
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
  null,
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
