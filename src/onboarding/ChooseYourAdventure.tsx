import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'
import Card from 'src/components/Card'
import DevSkipButton from 'src/components/DevSkipButton'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import EarnCoins from 'src/icons/EarnCoins'
import LogoHeart from 'src/icons/LogoHeart'
import PlusIcon from 'src/icons/PlusIcon'
import ProfilePlus from 'src/icons/ProfilePlus'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import {
  navigate,
  navigateHome,
  navigateHomeAndThenToScreen,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { AdventureCardName } from 'src/onboarding/types'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import { shuffle } from 'src/utils/random'
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
        <Text style={styles.cardText}>{text}</Text>
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
      text: t('chooseYourAdventure.options.earn'),
      goToNextScreen: () => {
        navigateHomeAndThenToScreen(Screens.EarnInfoScreen)
      },
      icon: <EarnCoins color={colors.black} />,
      name: AdventureCardName.Earn,
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
        navigateHomeAndThenToScreen(Screens.PointsIntro)
      },
      icon: <LogoHeart size={Spacing.Thick24} color={colors.black} />,
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
        AppAnalytics.track(OnboardingEvents.cya_button_press, {
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
    AppAnalytics.track(OnboardingEvents.cya_later, {
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
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 40,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    ...typeScale.bodyMedium,
  },
  header: {
    textAlign: 'center',
    marginTop: 50,
    ...typeScale.titleMedium,
  },
  card: {
    marginTop: Spacing.Regular16,
    backgroundColor: colors.gray1,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomButtonContainer: {
    padding: Spacing.Thick24,
    alignItems: 'center',
  },
  skip: {
    color: colors.black,
  },
  cardText: {
    ...typeScale.bodySmall,
    flex: 1,
    flexWrap: 'wrap',
  },
})
