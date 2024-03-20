import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  numberVerifiedDecentrallySelector,
  phoneNumberVerifiedSelector,
  superchargeTokenConfigByTokenSelector,
} from 'src/app/selectors'
import { SUPERCHARGE_LEARN_MORE } from 'src/brandingConfig'
import Button, { BtnSizes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import Pill from 'src/components/Pill'
import Touchable from 'src/components/Touchable'
import { RewardsScreenCta } from 'src/consumerIncentives/analyticsEventsTracker'
import {
  availableRewardsSelector,
  fetchAvailableRewardsErrorSelector,
  superchargeInfoSelector,
  superchargeRewardsLoadingSelector,
} from 'src/consumerIncentives/selectors'
import { claimRewards, fetchAvailableRewards } from 'src/consumerIncentives/slice'
import { SuperchargePendingReward, SuperchargeTokenConfig } from 'src/consumerIncentives/types'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import InfoIcon from 'src/icons/InfoIcon'
import Logo from 'src/icons/Logo'
import Times from 'src/icons/Times'
import { boostRewards, earn1, earn2 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { tokensByAddressSelector, tokensBySymbolSelector } from 'src/tokens/selectors'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { WEI_PER_TOKEN } from 'src/web3/consts'

const onLearnMore = () => {
  ValoraAnalytics.track(RewardsEvents.learn_more_pressed)
  navigate(Screens.WebViewScreen, { uri: SUPERCHARGE_LEARN_MORE })
}

function useDefaultTokenConfigToSupercharge(): Partial<SuperchargeTokenConfig> {
  const userCountry = useSelector(userLocationDataSelector)
  const { IS_IN_EUROPE } = useCountryFeatures()
  const tokensBySymbol = useSelector(tokensBySymbolSelector)
  const superchargeTokenConfigByToken = useSelector(superchargeTokenConfigByTokenSelector)

  const superchargeTokenSymbol = IS_IN_EUROPE
    ? 'cEUR'
    : userCountry?.countryCodeAlpha2 === 'BR'
      ? 'cREAL'
      : 'cUSD'

  const superchargeConfig =
    superchargeTokenConfigByToken[tokensBySymbol[superchargeTokenSymbol]?.address] ?? {}

  return {
    ...superchargeConfig,
    tokenSymbol: superchargeTokenSymbol,
  }
}

function Header() {
  const { t } = useTranslation()

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

  const userIsVerified = useSelector(phoneNumberVerifiedSelector)
  const numberVerifiedDecentrally = useSelector(numberVerifiedDecentrallySelector)

  const { superchargeApy } = useSelector((state) => state.app)
  const { hasBalanceForSupercharge, superchargingTokenConfig } =
    useSelector(superchargeInfoSelector)
  const defaultTokenConfigToSupercharge = useDefaultTokenConfigToSupercharge()
  const tokenConfigToSupercharge = superchargingTokenConfig ?? defaultTokenConfigToSupercharge

  return (
    <>
      <Text style={styles.title} testID="SuperchargeInstructions">
        {t('superchargeTitle')}
      </Text>
      <Text style={styles.description}>
        {t('superchargeDescription', {
          token: tokenConfigToSupercharge.tokenSymbol,
          apy: superchargeApy,
        })}
      </Text>
      {!userIsVerified && (
        <View style={styles.section}>
          <Image source={earn1} style={styles.sectionIcon} resizeMode="contain" />
          <Text style={styles.sectionText} testID="SuperchargeInstructions/ConnectNumber">
            {numberVerifiedDecentrally ? (
              <Trans
                i18nKey={'superchargeReconnectNumber'}
                tOptions={{ token: tokenConfigToSupercharge.tokenSymbol }}
              >
                <Text style={fontStyles.regular} />
              </Trans>
            ) : (
              t('superchargeConnectNumber')
            )}
          </Text>
        </View>
      )}
      {!hasBalanceForSupercharge && (
        <View style={[styles.section, userIsVerified ? {} : { opacity: 0.4 }]}>
          <Image source={earn2} style={styles.sectionIcon} resizeMode="contain" />
          <Text style={styles.sectionText}>
            {t('superchargeMinimumBalance', {
              amount: tokenConfigToSupercharge.minBalance,
              token: tokenConfigToSupercharge.tokenSymbol,
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
        onBackgroundPress={() => setTokenDetailsVisible(false)}
      >
        {t('superchargeTokenDetailsDialog.body')}
      </Dialog>
    </>
  )
}

function SuperchargingInfo() {
  const { t } = useTranslation()
  const { superchargeApy } = useSelector((state) => state.app)
  const { superchargingTokenConfig } = useSelector(superchargeInfoSelector)
  const defaultTokenConfigToSupercharge = useDefaultTokenConfigToSupercharge()
  const tokenConfigToSupercharge = superchargingTokenConfig ?? defaultTokenConfigToSupercharge

  return (
    <>
      <Text style={styles.title} testID="SuperchargingInfo">
        {t('superchargingTitleV1_54', { token: tokenConfigToSupercharge.tokenSymbol })}
      </Text>
      <Text style={styles.description}>
        {t('superchargingDescriptionV1_54', {
          token: tokenConfigToSupercharge.tokenSymbol,
          apy: superchargeApy,
        })}
      </Text>
    </>
  )
}

function ClaimSuperchargeRewards({ rewards }: { rewards: SuperchargePendingReward[] }) {
  const tokens = useSelector(tokensByAddressSelector)
  const { t } = useTranslation()

  const rewardsByToken: { [tokenAddress: string]: BigNumber } = {}

  rewards.forEach((reward) => {
    const tokenAddress = reward.details.tokenAddress.toLowerCase()

    rewardsByToken[tokenAddress] = (rewardsByToken[tokenAddress] || new BigNumber(0)).plus(
      new BigNumber(reward.details.amount).div(WEI_PER_TOKEN)
    )
  })

  const rewardStrings = Object.entries(rewardsByToken).map(
    ([token, amount]) => `${amount?.toFixed(2)} ${tokens[token]?.symbol}`
  )
  const [singleRewardToken, singleRewardAmount] = Object.entries(rewardsByToken)[0]

  return (
    <>
      <Text style={[styles.title, { color: colors.primary }]} testID="ClaimSuperchargeDescription">
        {rewardStrings.length > 1
          ? t('superchargeRewardsAvailableMultipleTokens', { amounts: rewardStrings.join(' & ') })
          : t('superchargeRewardsAvailable', {
              token: tokens[singleRewardToken]?.symbol,
              amount: singleRewardAmount?.toFixed(2),
            })}
      </Text>
      <Text style={styles.description}>{t('superchargeClaimText')}</Text>
    </>
  )
}

export default function ConsumerIncentivesHomeScreen() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const superchargeFetchError = useSelector(fetchAvailableRewardsErrorSelector)

  useEffect(() => {
    dispatch(fetchAvailableRewards())
  }, [])

  useEffect(() => {
    if (superchargeFetchError) {
      dispatch(showError(ErrorMessages.SUPERCHARGE_FETCH_REWARDS_FAILED))
    }
  }, [superchargeFetchError])

  const restrictSuperchargeForClaimOnly = getFeatureGate(
    StatsigFeatureGates.RESTRICT_SUPERCHARGE_FOR_CLAIM_ONLY
  )

  const userIsVerified = useSelector(phoneNumberVerifiedSelector)
  const { hasBalanceForSupercharge, superchargingTokenConfig, hasMaxBalance } =
    useSelector(superchargeInfoSelector)

  const isSupercharging = userIsVerified && hasBalanceForSupercharge
  const defaultTokenConfigToSupercharge = useDefaultTokenConfigToSupercharge()
  const tokenConfigToSupercharge = superchargingTokenConfig ?? defaultTokenConfigToSupercharge

  const claimRewardsLoading = useSelector(superchargeRewardsLoadingSelector)
  const superchargeRewards = useSelector(availableRewardsSelector)
  const loadingAvailableRewards = useSelector(
    (state) => state.supercharge.fetchAvailableRewardsLoading
  )
  const canClaimRewards = superchargeRewards.length > 0

  const showLoadingIndicator = !canClaimRewards && loadingAvailableRewards

  const onPressCTA = async () => {
    if (canClaimRewards) {
      dispatch(claimRewards(superchargeRewards))
      ValoraAnalytics.track(RewardsEvents.rewards_screen_cta_pressed, {
        buttonPressed: RewardsScreenCta.ClaimRewards,
      })
    } else if (userIsVerified) {
      navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
      ValoraAnalytics.track(RewardsEvents.rewards_screen_cta_pressed, {
        buttonPressed: RewardsScreenCta.CashIn,
      })
    } else {
      navigate(Screens.VerificationStartScreen, { hasOnboarded: true })
      ValoraAnalytics.track(RewardsEvents.rewards_screen_cta_pressed, {
        buttonPressed: RewardsScreenCta.VerifyPhone,
      })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Header />
        <Image style={styles.image} source={boostRewards} />
        {showLoadingIndicator ? (
          <ActivityIndicator size="small" color={colors.primary} testID="SuperchargeLoading" />
        ) : canClaimRewards ? (
          <ClaimSuperchargeRewards rewards={superchargeRewards} />
        ) : isSupercharging ? (
          <SuperchargingInfo />
        ) : (
          <SuperchargeInstructions />
        )}
      </ScrollView>
      <Text style={styles.disclaimer}>
        {canClaimRewards ? (
          <Trans i18nKey="superchargeDisclaimerDayLimit">
            <Text onPress={onLearnMore} style={styles.learnMoreLink} />
          </Trans>
        ) : hasMaxBalance ? (
          t('superchargeDisclaimerMaxRewards', { token: superchargingTokenConfig?.tokenSymbol })
        ) : restrictSuperchargeForClaimOnly ? (
          ''
        ) : (
          t('superchargeDisclaimer', {
            amount: tokenConfigToSupercharge.maxBalance,
            token: tokenConfigToSupercharge.tokenSymbol,
          })
        )}
      </Text>

      {/* If the restricted supercharge promo rule applies, prevent the user from seeing cash in CTA */}
      {restrictSuperchargeForClaimOnly && userIsVerified && !canClaimRewards ? null : (
        <View style={styles.buttonContainer}>
          <Button
            size={BtnSizes.FULL}
            text={
              canClaimRewards
                ? t('superchargeClaimButton')
                : userIsVerified
                  ? t('cashIn', { currency: tokenConfigToSupercharge.tokenSymbol })
                  : t('connectNumber')
            }
            icon={canClaimRewards && <Logo size={24} color={colors.white} />}
            showLoading={showLoadingIndicator || claimRewardsLoading}
            disabled={showLoadingIndicator || claimRewardsLoading}
            onPress={onPressCTA}
            testID="ConsumerIncentives/CTA"
          />
        </View>
      )}
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
    marginTop: 24,
  },
  sectionText: {
    ...fontStyles.regular600,
    flex: 1,
    flexGrow: 1,
    alignSelf: 'center',
  },
  sectionIcon: {
    marginRight: 16,
  },
  tokenDetailsIcon: {
    width: 12,
    height: 12,
    marginBottom: 2,
  },
  disclaimer: {
    ...fontStyles.small,
    color: colors.gray5,
    textAlign: 'center',
    marginBottom: 18,
    marginHorizontal: 24,
  },
  learnMoreLink: {
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
})
