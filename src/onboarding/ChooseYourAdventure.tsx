import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Card from 'src/components/Card'
import DevSkipButton from 'src/components/DevSkipButton'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import CeloIconNew from 'src/icons/CeloIconNew'
import GraphSparkle from 'src/icons/GraphSparkle'
import PlusIcon from 'src/icons/PlusIcon'
import ProfilePlus from 'src/icons/ProfilePlus'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import {
  navigate,
  navigateClearingStack,
  navigateHome,
  navigateHomeAndThenToScreen,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AdventureCardName } from 'src/onboarding/types'
import { useSelector } from 'src/redux/hooks'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import { shuffle } from 'src/utils/random'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

const DEFAULT_SEED = '0x0'

const AdventureCard = ({
  onPress,
  text,
  index,
  icon,
}: {
  onPress: () => void
  text: string
  index: number
  icon: React.ReactNode
}) => (
  <Card
    key={index}
    testID={`AdventureCard/${index}/${text}`}
    style={styles.card}
    rounded={true}
    shadow={Shadow.BarShadow}
  >
    <Touchable style={styles.pressableCard} onPress={onPress}>
      <>
        <View style={styles.iconContainer}>{icon}</View>
        <Text style={fontStyles.small500}>{text}</Text>
      </>
    </Touchable>
  </Card>
)

function ChooseYourAdventure() {
  const { t } = useTranslation()
  const address = useSelector(walletAddressSelector)

  const cardDetails = [
    {
      text: t('chooseYourAdventure.options.add'),
      goToNextScreen: () => {
        // navigate home so that closing the fiat exchange currency bottom sheet
        // takes the user back to Home screen. Can't use
        // navigateHomeAndThenToScreen here because it doesn't work for bottom
        // sheets.
        navigateHome()
        navigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
      },
      icon: <PlusIcon />,
      name: AdventureCardName.Add,
    },
    {
      text: t('chooseYourAdventure.options.dapp'),
      goToNextScreen: () => {
        if (getFeatureGate(StatsigFeatureGates.USE_TAB_NAVIGATOR)) {
          navigateClearingStack(Screens.TabNavigator, { initialScreen: Screens.TabDiscover })
        } else {
          navigateClearingStack(Screens.DrawerNavigator, {
            initialScreen: Screens.DAppsExplorerScreen,
          })
        }
      },
      icon: <GraphSparkle />,
      name: AdventureCardName.Dapp,
    },
    {
      text: t('chooseYourAdventure.options.profile'),
      goToNextScreen: () => {
        navigateHomeAndThenToScreen(Screens.Profile)
      },
      icon: <ProfilePlus />,
      name: AdventureCardName.Profile,
    },
    {
      text: t('chooseYourAdventure.options.learn'),
      goToNextScreen: () => {
        if (getFeatureGate(StatsigFeatureGates.USE_TAB_NAVIGATOR)) {
          navigateHomeAndThenToScreen(Screens.TokenDetails, { tokenId: networkConfig.celoTokenId })
        } else {
          navigateClearingStack(Screens.DrawerNavigator, {
            initialScreen: Screens.ExchangeHomeScreen,
          })
        }
      },
      icon: <CeloIconNew />,
      name: AdventureCardName.Learn,
    },
  ]

  const shuffledCardDetails = useMemo(() => {
    return shuffle(cardDetails, address ?? DEFAULT_SEED)
  }, [address])

  const cardOrder: AdventureCardName[] = useMemo(() => {
    return shuffledCardDetails.map((details) => details.name)
  }, [shuffledCardDetails])

  const getAdventureCards = () => {
    return shuffledCardDetails.map(({ text, goToNextScreen, icon, name }, index) => {
      const onPress = () => {
        ValoraAnalytics.track(OnboardingEvents.cya_button_press, {
          position: index + 1,
          cardName: name,
          cardOrder,
        })
        goToNextScreen()
      }
      return <AdventureCard key={name} text={text} onPress={onPress} index={index} icon={icon} />
    })
  }

  const onNavigateHome = () => {
    ValoraAnalytics.track(OnboardingEvents.cya_later, {
      cardOrder,
    })
    navigateHome()
  }

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton nextScreen={Screens.PincodeSet} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
        <Text style={styles.header}>{t('chooseYourAdventure.header')}</Text>
        <Text style={styles.subtitle}>{t('chooseYourAdventure.subtitle')}</Text>
        {getAdventureCards()}
      </ScrollView>
      <View style={styles.bottomButtonContainer}>
        <TextButton testID="ChooseYourAdventure/Later" style={styles.skip} onPress={onNavigateHome}>
          {t('chooseYourAdventure.later')}
        </TextButton>
      </View>
    </SafeAreaView>
  )
}

ChooseYourAdventure.navOptions = nuxNavigationOptionsNoBackButton

export default ChooseYourAdventure

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 40,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    ...fontStyles.regular,
  },
  header: {
    textAlign: 'center',
    marginTop: 50,
    ...fontStyles.h1,
  },
  card: {
    marginTop: Spacing.Smallest8,
    flex: 1,
    padding: 0,
  },
  pressableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    padding: Spacing.Regular16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 100,
    marginRight: Spacing.Regular16,
    backgroundColor: colors.gray2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonContainer: {
    padding: Spacing.Thick24,
    alignItems: 'center',
  },
  skip: {
    color: colors.onboardingBrownLight,
  },
})
