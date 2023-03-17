import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import seedrandom from 'seedrandom'
import Card from 'src/components/Card'
import DevSkipButton from 'src/components/DevSkipButton'
import TextButton from 'src/components/TextButton'
import Touchable from 'src/components/Touchable'
import CeloIconNew from 'src/icons/CeloIconNew'
import GraphSparkle from 'src/icons/GraphSparkle'
import PlusIcon from 'src/icons/PlusIcon'
import ProfilePlus from 'src/icons/ProfilePlus'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Shadow, Spacing } from 'src/styles/styles'
import { walletAddressSelector } from 'src/web3/selectors'

const AdventureCard = ({
  onPress,
  text,
  index,
  icon,
}: {
  onPress: () => void
  text: string
  index: number
  icon: React.ElementType
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

// https://stackoverflow.com/a/2450976/112731
// Fisher–Yates shuffle algorithm to shuffle an array
function shuffle(array: any[], seed: string) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(seedrandom(seed)() * currentIndex)
    currentIndex -= 1

    // And swap it with the current element.
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }

  return array
}

function ChoseYourAdventure() {
  const { t } = useTranslation()
  const address = useSelector(walletAddressSelector)

  const getAdventureCards = () => {
    const cardDetails = [
      {
        text: t('choseYourAdventure.options.add'),
        goToNextScreen: () => {
          navigateHome({ params: { initialScreen: Screens.FiatExchange } })
        },
        icon: <PlusIcon />,
      },
      {
        text: t('choseYourAdventure.options.dapp'),
        goToNextScreen: () => {
          navigateHome({ params: { initialScreen: Screens.DAppsExplorerScreen } })
        },
        icon: <GraphSparkle />,
      },
      {
        text: t('choseYourAdventure.options.profile'),
        goToNextScreen: () => {
          navigateHome()
          navigate(Screens.Profile)
        },
        icon: <ProfilePlus />,
      },
      {
        text: t('choseYourAdventure.options.learn'),
        goToNextScreen: () => {
          navigateHome({ params: { initialScreen: Screens.ExchangeHomeScreen } })
        },
        icon: <CeloIconNew />,
      },
    ]
    return shuffle(cardDetails, address ?? Math.random().toString()).map(
      ({ text, goToNextScreen: onPress, icon }, index) => (
        <AdventureCard text={text} onPress={onPress} index={index} icon={icon} />
      )
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <DevSkipButton nextScreen={Screens.PincodeSet} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="always">
        <Text style={styles.header}>{t('choseYourAdventure.header')}</Text>
        <Text style={styles.subtitle}>{t('choseYourAdventure.subtitle')}</Text>
        {getAdventureCards()}
      </ScrollView>
      <View style={styles.bottomButtonContainer}>
        <TextButton
          testID="ChooseYourAdventure/Later"
          style={styles.skip}
          onPress={() => navigateHome()}
        >
          {t('choseYourAdventure.later')}
        </TextButton>
      </View>
    </SafeAreaView>
  )
}

ChoseYourAdventure.navOptions = nuxNavigationOptionsNoBackButton

export default ChoseYourAdventure

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
