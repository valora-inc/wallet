import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Platform, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native'
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
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
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
    navigate(
      firstOnboardingScreen({
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

  renderTerms() {
    const { t } = this.props

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
        <Text style={styles.disclaimer}>{t('terms.goldDisclaimer')}</Text>
      </ScrollView>
    )
  }

  renderColloquialTerms() {
    const { t } = this.props

    return (
      <SectionList
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        testID="colloquialTermsSectionList"
        sections={[
          {
            title: t('termsColloquial.privacyHeading'),
            data: [
              { text: 'termsColloquial.privacy1', onPress: this.onPressGoToPrivacyPolicy },
              { text: 'termsColloquial.privacy2' },
              { text: 'termsColloquial.privacy3' },
            ],
          },
          {
            title: t('termsColloquial.walletHeading'),
            data: [{ text: 'termsColloquial.wallet1' }, { text: 'termsColloquial.wallet2' }],
          },
        ]}
        renderItem={({ item }) => {
          return (
            <View style={styles.itemContainer}>
              <Text style={styles.item}>{'\u2022'}</Text>
              {item.onPress ? (
                <Text style={styles.item}>
                  <Trans i18nKey={item.text}>
                    <Text onPress={item.onPress} style={styles.link} />
                  </Trans>
                </Text>
              ) : (
                <Text style={styles.item}>
                  <Trans i18nKey={item.text} />
                </Text>
              )}
            </View>
          )
        }}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ListHeaderComponent={
          <Text style={styles.titleColloquial}>{t('termsColloquial.title')}</Text>
        }
        ListFooterComponent={
          <Text style={styles.fullTerms}>
            <Trans i18nKey="termsColloquial.fullTerms">
              <Text onPress={this.onPressGoToTerms} style={styles.link} />
            </Trans>
          </Text>
        }
        stickySectionHeadersEnabled={false}
      />
    )
  }

  render() {
    const { t } = this.props

    const { variant } = getExperimentParams(
      ExperimentConfigs[StatsigExperiments.ONBOARDING_TERMS_AND_CONDITIONS]
    )

    return (
      <SafeAreaView
        style={styles.container}
        // don't apply safe area padding to top on iOS since it is opens like a
        // bottom sheet (modal animated screen)
        edges={Platform.select({ ios: ['bottom', 'left', 'right'] })}
      >
        <DevSkipButton nextScreen={Screens.PincodeSet} />
        {variant === 'colloquial_terms' ? this.renderColloquialTerms() : this.renderTerms()}
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
  link: {
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: MARGIN,
    marginHorizontal: MARGIN,
  },
  titleColloquial: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Small12,
  },
  sectionHeader: {
    ...typeScale.labelSemiBoldSmall,
    marginVertical: Spacing.Small12,
  },
  itemContainer: {
    flexDirection: 'row',
    gap: Spacing.Smallest8,
  },
  item: {
    ...typeScale.bodySmall,
    flexShrink: 1,
  },
  fullTerms: {
    ...typeScale.labelSemiBoldSmall,
    marginVertical: Spacing.Small12,
    color: Colors.infoDark,
  },
})
