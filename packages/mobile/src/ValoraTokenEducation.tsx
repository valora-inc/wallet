import Button, { BtnSizes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CELO_REWARDS_T_AND_C } from 'src/brandingConfig'
import { RewardsScreenCta } from 'src/consumerIncentives/analyticsEventsTracker'
import { celoNotification, earn1, earn2, earn3 } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { useCountryFeatures } from 'src/utils/countryFeatures'
import { Currency } from 'src/utils/currencies'

type Props = StackScreenProps<StackParamList, Screens.ConsumerIncentivesHomeScreen>
export default function ConsumerIncentivesHomeScreen(props: Props) {
  const { t } = useTranslation()
  const userIsVerified = useSelector((state) => state.app.numberVerified)
  const insets = useSafeAreaInsets()

  const { rewardsPercent, rewardsMax: maxBalance, rewardsMin: minBalance } = useSelector(
    (state) => state.app
  )

  const { USE_CEUR } = useCountryFeatures()
  const currency = USE_CEUR ? Currency.Euro : Currency.Dollar

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

  const onLearnMore = () => navigate(Screens.WebViewScreen, { uri: CELO_REWARDS_T_AND_C })

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Touchable
          style={[styles.closeButton, { marginTop: insets.top }]}
          onPress={navigateBack}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <Times />
        </Touchable>
        <Image style={styles.image} source={celoNotification} />
        <Text style={styles.title}>{'What are Valora Tokens'}</Text>
        <Text style={styles.description}>
          {
            "Valora tokens are a token minted by Valora. They're an opportunity to explore the world of DeFi -- including lending pools, staking, yield farming -- with no risk."
          }
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

ConsumerIncentivesHomeScreen.navOptions = noHeader

const styles = StyleSheet.create({
  image: {
    marginTop: 100,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  closeButton: {
    alignSelf: 'flex-start',
  },
  title: {
    ...fontStyles.h2,
    marginTop: 32,
    textAlign: 'center',
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
  },
})
