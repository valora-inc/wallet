import Button, { BtnSizes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SUPERCHARGE_T_AND_C } from 'src/brandingConfig'
import Dialog from 'src/components/Dialog'
import Pill from 'src/components/Pill'
import { SUPERCHARGE_AVAILABLE_REWARDS_URL } from 'src/config'
import { RewardsScreenCta } from 'src/consumerIncentives/analyticsEventsTracker'
import { claimRewards } from 'src/consumerIncentives/reducer'
import {
  SuperchargePendingReward,
  SuperchargeToken,
  SuperchargeTokenConfig,
} from 'src/consumerIncentives/types'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import InfoIcon from 'src/icons/InfoIcon'
import { boostRewards, earn1, earn2 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import useSelector from 'src/redux/useSelector'
import { stablecoinsSelector, tokensByAddressSelector } from 'src/tokens/selectors'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

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
    if (tokenUserInfo?.balance.gte(tokenConfig.minBalance)) {
      return true
    }
  }
  return false
}

function Header() {
  const { t } = useTranslation()
  const onLearnMore = () => navigate(Screens.WebViewScreen, { uri: SUPERCHARGE_T_AND_C })

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
          <Image source={earn1} style={styles.sectionIcon} resizeMode="contain" />
          <Text style={styles.sectionText}>{t('superchargeConnectNumber')}</Text>
        </View>
      )}
      {!hasBalanceForSupercharge && (
        <View style={[styles.section, userIsVerified ? {} : { opacity: 0.4 }]}>
          <Image source={earn2} style={styles.sectionIcon} resizeMode="contain" />
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

function ClaimSuperchargeRewards({ rewards }: { rewards: SuperchargePendingReward[] }) {
  const tokens = useSelector(tokensByAddressSelector)
  const { t } = useTranslation()

  const rewardsByToken: { [tokenAddress: string]: BigNumber | undefined } = rewards.reduce(
    (acc, reward) => {
      const tokenAddress = reward.tokenAddress.toLowerCase()
      if (!acc[tokenAddress]) {
        acc[tokenAddress] = new BigNumber(0)
      }
      acc[tokenAddress] = acc[tokenAddress].plus(
        new BigNumber(reward.amount, 16).div(WEI_PER_TOKEN)
      )
      return acc
    },
    {} as { [tokenAddress: string]: BigNumber }
  )

  const rewardStrings = Object.entries(rewardsByToken).map(
    ([token, amount]) => `${amount?.toFixed(2)} ${tokens[token]?.symbol}`
  )
  const [singleRewardToken, singleRewardAmount] = Object.entries(rewardsByToken)[0]

  return (
    <>
      <Text style={[styles.title, { color: colors.greenUI }]} testID="ClaimSuperchargeDescription">
        {rewardStrings.length > 1
          ? t('superchargeRewardsAvailableMultipleTokens', { amount: rewardStrings.join(' & ') })
          : t('superchargeRewardsAvailable', {
              token: tokens[singleRewardToken]?.symbol,
              amount: singleRewardAmount?.toFixed(2),
            })}
      </Text>
      <Text style={styles.description}>{t('superchargeClaimText')}</Text>
    </>
  )
}

function useFetchAvailableRewards(): {
  availableRewards: SuperchargePendingReward[]
  loading: boolean
} {
  const address = useSelector(walletAddressSelector)

  const { result, loading } = useAsync(async () => {
    try {
      const response = await fetch(`${SUPERCHARGE_AVAILABLE_REWARDS_URL}?address=${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      })

      const responseBody = await response.json()
      return responseBody.availableRewards ?? []
    } catch (error) {
      Logger.error('SuperchargeScreen', 'Error while fetching pending rewards', error)
    }
  }, [])
  return { availableRewards: result ?? [], loading }
}

export default function ConsumerIncentivesHomeScreen() {
  const { t } = useTranslation()

  const userIsVerified = useSelector((state) => state.app.numberVerified)
  const hasBalanceForSupercharge = useHasBalanceForSupercharge()
  const isSupercharging = userIsVerified && hasBalanceForSupercharge
  const tokenToSupercharge = useTokenToSupercharge()

  const { availableRewards, loading: loadingAvailableRewards } = useFetchAvailableRewards()
  const claimRewardsLoading = useSelector((state) => state.supercharge.loading)
  const canClaimRewards = availableRewards.length > 0
  const dispatch = useDispatch()

  const onPressCTA = async () => {
    if (canClaimRewards) {
      dispatch(claimRewards(availableRewards))
    } else if (userIsVerified) {
      navigate(Screens.FiatExchangeOptions, { isCashIn: true })
    } else {
      navigate(Screens.VerificationEducationScreen, { hideOnboardingStep: true })
    }
    ValoraAnalytics.track(RewardsEvents.rewards_screen_cta_pressed, {
      buttonPressed: canClaimRewards
        ? RewardsScreenCta.ClaimRewards
        : userIsVerified
        ? RewardsScreenCta.CashIn
        : RewardsScreenCta.VerifyPhone,
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
        {loadingAvailableRewards ? (
          <ActivityIndicator size="small" color={colors.greenUI} />
        ) : canClaimRewards ? (
          <ClaimSuperchargeRewards rewards={availableRewards} />
        ) : isSupercharging ? (
          <SuperchargingInfo />
        ) : (
          <SuperchargeInstructions />
        )}
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
            canClaimRewards
              ? t('superchargeClaimButton')
              : userIsVerified
              ? t('cashIn', { currency: tokenToSupercharge.token })
              : t('connectNumber')
          }
          showLoading={loadingAvailableRewards || claimRewardsLoading}
          disabled={loadingAvailableRewards}
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
    flex: 1,
    flexGrow: 1,
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
  },
  buttonContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
})
