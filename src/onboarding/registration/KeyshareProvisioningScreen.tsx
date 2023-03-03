import { StackScreenProps } from '@react-navigation/stack'
import { isNull } from 'lodash'
import AnimatedLottieView from 'lottie-react-native'
import React, { useEffect, useLayoutEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import Animated, { EasingNode } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Logo, { LogoTypes } from 'src/icons/Logo'
import { whiteProgressBig } from 'src/images/Images'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { loop } from 'src/utils/reanimated'
import { accountAddressSelector } from 'src/web3/selectors'

const TAG = 'onboarding/keyshare'

type Props = {} & StackScreenProps<StackParamList, Screens.KeyshareProvisioningScreen>

const KeyshareProvisioningScreen = ({ navigation }: Props) => {
  const { t } = useTranslation()
  const account = useSelector(accountAddressSelector)

  const accountReady = useMemo(() => {
    return !isNull(account)
  }, [account])

  useEffect(() => {
    if (accountReady) {
      handleAccountReady()
    }
  }, [accountReady])

  const handleAccountReady = () => {
    goToNextScreen()
  }

  const goToNextScreen = () => {
    navigateClearingStack(Screens.NuxInterests)
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <Logo type={LogoTypes.LIGHT} />,
    })
  }, [navigation])

  const progressAnimatedStyle = useMemo(() => {
    const progress = loop({
      duration: 1000,
      easing: EasingNode.linear,
      autoStart: true,
    })
    const rotate = Animated.interpolateNode(progress, {
      inputRange: [0, 1],
      outputRange: [0, 2 * Math.PI],
    })

    return {
      // TODO fix type
      transform: [{ rotate }] as any,
    }
  }, [])

  return (
    <SafeAreaView style={styles.screen} edges={['bottom', 'top']}>
      <View style={styles.spread}>
        <View style={styles.row}>
          <View>
            <Animated.Image source={whiteProgressBig} style={[progressAnimatedStyle]} />
            <AnimatedLottieView source={require('./keyshares.json')} autoPlay loop />
          </View>
        </View>

        <View style={styles.innerContainer}>
          <Text style={styles.header}>{t('provisioningInProgress')}</Text>
          <Text style={styles.content}>{t('keyshareCreation.0')}</Text>
          <Text style={styles.content}>{t('keyshareCreation.1')}</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

KeyshareProvisioningScreen.navigationOptions = nuxNavigationOptions

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.greenBrand,
  },
  spread: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  innerContainer: {
    padding: variables.contentPadding,
    marginHorizontal: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.greenFaint,
    borderRadius: 16,
  },
  header: {
    textAlign: 'center',
    ...fontStyles.h1,
    color: Colors.light,
    paddingBottom: variables.contentPadding,
  },
  content: {
    textAlign: 'center',
    ...fontStyles.small,
    color: Colors.light,
    fontWeight: 'bold',
    paddingBottom: variables.contentPadding,
  },
})

export default KeyshareProvisioningScreen
