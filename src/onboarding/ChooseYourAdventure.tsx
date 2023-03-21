import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
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

function ChooseYourAdventure() {
  const { t } = useTranslation()
  const address = useSelector(walletAddressSelector)

  const getAdventureCards = () => {
    const cardDetails = [
      {
        text: t('chooseYourAdventure.options.add'),
        goToNextScreen: () => {
          navigateHome({ params: { initialScreen: Screens.FiatExchange } })
        },
        icon: <PlusIcon />,
      },
      {
        text: t('chooseYourAdventure.options.dapp'),
        goToNextScreen: () => {
          navigateHome({ params: { initialScreen: Screens.DAppsExplorerScreen } })
        },
        icon: <GraphSparkle />,
      },
      {
        text: t('chooseYourAdventure.options.profile'),
        goToNextScreen: () => {
          navigateHome()
          navigate(Screens.Profile)
        },
        icon: <ProfilePlus />,
      },
      {
        text: t('chooseYourAdventure.options.learn'),
        goToNextScreen: () => {
          navigateHome({ params: { initialScreen: Screens.ExchangeHomeScreen } })
        },
        icon: <CeloIconNew />,
      },
    ]
    return shuffle(cardDetails, address ?? DEFAULT_SEED).map(
      ({ text, goToNextScreen: onPress, icon }, index) => (
        <AdventureCard text={text} onPress={onPress} index={index} icon={icon} />
      )
    )
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
        <TextButton
          testID="ChooseYourAdventure/Later"
          style={styles.skip}
          onPress={() => navigateHome()}
        >
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
