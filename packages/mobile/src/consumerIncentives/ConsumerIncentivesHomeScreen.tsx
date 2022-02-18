import Button, { BtnSizes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CELO_REWARDS_T_AND_C } from 'src/brandingConfig'
import Dialog from 'src/components/Dialog'
import Pill from 'src/components/Pill'
import { RewardsScreenCta } from 'src/consumerIncentives/analyticsEventsTracker'
import { SuperchargeToken, SuperchargeTokenConfig } from 'src/consumerIncentives/types'
import InfoIcon from 'src/icons/InfoIcon'
import { boostRewards, earn1, earn2 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import { stablecoinsSelector } from 'src/tokens/selectors'
import { useCountryFeatures } from 'src/utils/countryFeatures'

function useTokenToSupercharge(): Partial<SuperchargeTokenConfig> {
  const { superchargeTokens } = useSelector((state) => state.app)
  const userCountry = useSelector(userLocationDataSelector)
  const { IS_IN_EUROPE } = useCountryFeatures()

  const tokenToSupercharge = IS_IN_EUROPE
    ? SuperchargeToken.cEUR
    : userCountry?.countryCodeAlpha2 === 'BR'
    ? SuperchargeToken.cREAL
    : SuperchargeToken.cUSD
  return (
    superchargeTokens.find((token) => token.token === tokenToSupercharge) ?? {
      token: tokenToSupercharge,
    }
  )
}

function useHasBalanceForSupercharge() {
  const { superchargeTokens } = useSelector((state) => state.app)
  const tokens = useSelector(stablecoinsSelector)

  for (const tokenConfig of superchargeTokens) {
    const tokenUserInfo = tokens.find((t) => t.symbol === tokenConfig.token)
    if (tokenUserInfo?.balance.gt(tokenConfig.minBalance)) {
      return true
    }
  }
  return false
}

function Header() {
  const { t } = useTranslation()
  const onLearnMore = () => navigate(Screens.WebViewScreen, { uri: CELO_REWARDS_T_AND_C })

  return (
    <View style={styles.headerContainer}>
      <Touchable onPress={navigateBack} borderless={true} hitSlop={variables.iconHitslop}>
        <Times />
      </Touchable>
      <Pill text={t('learnMore')} onPress={onLearnMore} testID="LearnMore" />
    </View>
  )
}

function SuperchargeInstructions() {
  const { t } = useTranslation()
  const [tokenDetailsVisible, setTokenDetailsVisible] = useState(false)

  const userIsVerified = useSelector((state) => state.app.numberVerified)
  const { superchargeApy } = useSelector((state) => state.app)
  const hasBalanceForSupercharge = useHasBalanceForSupercharge()
  const tokenToSupercharge = useTokenToSupercharge()

  return (
    <>
      <Text style={styles.title} testID="SuperchargeInstructions">
        {t('superchargeTitle')}
      </Text>
      <Text style={styles.description}>
        {t('superchargeDescription', { token: tokenToSupercharge.token, apy: superchargeApy })}
      </Text>
      {!userIsVerified && (
        <View style={styles.section}>
          <Image source={earn1} resizeMode="contain" />
          <Text style={styles.sectionText}>{t('superchargeConnectNumber')}</Text>
        </View>
      )}
      {!hasBalanceForSupercharge && (
        <View style={[styles.section, userIsVerified ? {} : { opacity: 0.4 }]}>
          <Image source={earn2} resizeMode="contain" />
          <Text style={styles.sectionText}>
            {t('superchargeMinimumBalance', {
              amount: tokenToSupercharge.minBalance,
              token: tokenToSupercharge.token,
            })}{' '}
            <Touchable
              style={styles.tokenDetailsIcon}
              onPress={() => setTokenDetailsVisible(true)}
              hitSlop={variables.iconHitslop}
            >
              <InfoIcon size={12} />
            </Touchable>
          </Text>
        </View>
      )}

      <Dialog
        title={t('superchargeTokenDetailsDialog.title')}
        isVisible={tokenDetailsVisible}
        secondaryActionText={t('superchargeTokenDetailsDialog.dismiss')}
        secondaryActionPress={() => setTokenDetailsVisible(false)}
      >
        {t('superchargeTokenDetailsDialog.body')}
      </Dialog>
    </>
  )
}

function SuperchargingInfo() {
  const { t } = useTranslation()
  const { superchargeApy } = useSelector((state) => state.app)
  const tokenToSupercharge = useTokenToSupercharge()

  return (
    <>
      <Text style={styles.title} testID="SuperchargingInfo">
        {t('superchargingTitle', { token: tokenToSupercharge.token })}
      </Text>
      <Text style={styles.description}>
        {t('superchargingDescription', { token: tokenToSupercharge.token, apy: superchargeApy })}
      </Text>
    </>
  )
}

export default function ConsumerIncentivesHomeScreen() {
  const { t } = useTranslation()

  const userIsVerified = useSelector((state) => state.app.numberVerified)
  const hasBalanceForSupercharge = useHasBalanceForSupercharge()
  const isSupercharging = userIsVerified && hasBalanceForSupercharge
  const tokenToSupercharge = useTokenToSupercharge()

  const onPressCTA = () => {
    if (userIsVerified) {
      navigate(Screens.FiatExchangeOptions, { isCashIn: true })
    } else {
      navigate(Screens.VerificationEducationScreen, { hideOnboardingStep: true })
    }
    ValoraAnalytics.track(RewardsEvents.rewards_screen_cta_pressed, {
      buttonPressed: userIsVerified ? RewardsScreenCta.CashIn : RewardsScreenCta.VerifyPhone,
    })
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <Image style={styles.image} source={boostRewards} />
        {isSupercharging ? <SuperchargingInfo /> : <SuperchargeInstructions />}
      </ScrollView>
      <Text style={styles.disclaimer}>
        {t('superchargeDisclaimer', {
          amount: tokenToSupercharge.maxBalance,
          token: tokenToSupercharge.token,
        })}
      </Text>
      <View style={styles.buttonContainer}>
        <Button
          size={BtnSizes.FULL}
          text={
            userIsVerified
              ? t('cashIn', { currency: tokenToSupercharge.token })
              : t('connectNumber')
          }
          onPress={onPressCTA}
          testID="ConsumerIncentives/CTA"
        />
      </View>
    </SafeAreaView>
  )
}

ConsumerIncentivesHomeScreen.navOptions = noHeader

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  headerContainer: {
    width: '100%',
    marginTop: 12,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  image: {
    marginTop: 18,
  },
  title: {
    ...fontStyles.h2,
    marginTop: 32,
    textAlign: 'center',
  },
  description: {
    ...fontStyles.regular,
    marginTop: 12,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  sectionText: {
    ...fontStyles.regular600,
    marginLeft: 20,
  },
  tokenDetailsIcon: {
    marginBottom: 2,
  },
  disclaimer: {
    ...fontStyles.small,
    color: colors.gray5,
    textAlign: 'center',
    marginBottom: 18,
  },
  buttonContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
})
