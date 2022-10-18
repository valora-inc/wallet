import * as React from 'react'
import { useState } from 'react'
import {
  Dimensions,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { NativeSafeAreaViewProps, SafeAreaView } from 'react-native-safe-area-context'
import Swiper from 'react-native-swiper'
import { OnboardingEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnTypes } from 'src/components/Button'
import BackChevron from 'src/icons/BackChevron'
import Logo, { LogoTypes } from 'src/icons/Logo'
import Times from 'src/icons/Times'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import progressDots from 'src/styles/progressDots'

export enum EmbeddedNavBar {
  Close = 'Close',
  Drawer = 'Drawer',
}

export enum EducationTopic {
  onboarding = 'onboarding',
  backup = 'backup',
  celo = 'celo',
}

export interface EducationStep {
  image: ImageSourcePropType | null
  topic: EducationTopic
  title: string
  // If set to true, title is displayed at the top
  isTopTitle?: boolean
  text?: string
}

export type Props = NativeSafeAreaViewProps & {
  embeddedNavBar: EmbeddedNavBar | null
  stepInfo: EducationStep[]
  buttonType?: BtnTypes
  buttonText: string
  finalButtonType?: BtnTypes
  finalButtonText: string
  dotStyle?: StyleProp<ViewStyle>
  activeDotStyle?: StyleProp<ViewStyle>
  onFinish: () => void
  experimentalSwiper?: boolean
}

const Education = ({
  style,
  embeddedNavBar,
  stepInfo,
  buttonText,
  finalButtonText,
  onFinish,
  experimentalSwiper = false,
  buttonType = BtnTypes.SECONDARY,
  finalButtonType = BtnTypes.PRIMARY,
  dotStyle = progressDots.circlePassive,
  activeDotStyle = progressDots.circleActive,
  ...passThroughProps
}: Props) => {
  const [step, setStep] = useState<number>(0)
  const swipeRef = React.createRef<Swiper>()

  const goBack = () => {
    const { topic } = stepInfo[step]
    if (step === 0) {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_cancel)
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_cancel)
      }
      navigateBack()
    } else {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.previous,
        })
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.previous,
        })
      } else if (topic === EducationTopic.onboarding) {
        ValoraAnalytics.track(OnboardingEvents.onboarding_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.previous,
        })
      }
      swipeRef?.current?.scrollBy(-1, true)
    }
  }

  const nextStep = () => {
    const { topic } = stepInfo[step]
    const isLastStep = step === stepInfo.length - 1

    if (isLastStep) {
      onFinish()
    } else {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.next,
        })
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.next,
        })
      } else if (topic === EducationTopic.onboarding) {
        ValoraAnalytics.track(OnboardingEvents.onboarding_education_scroll, {
          currentStep: step,
          direction: ScrollDirection.next,
        })
      }
      swipeRef?.current?.scrollBy(1, true)
    }
  }

  const progress = useSharedValue(0)
  const width = Dimensions.get('window').width

  const logoAnimatedStyle = useAnimatedStyle(() => {
    const padding = 24
    const start = 0 + padding
    const end = width - padding
    const distance = Math.abs(start - end)
    return {
      transform: [{ translateX: progress.value * (distance / 4) }],
    }
  }, [progress.value])

  React.useEffect(() => {
    progress.value = withTiming(step)
  }, [step])

  const renderEmbeddedNavBar = () => {
    const color = experimentalSwiper ? colors.light : colors.dark
    switch (embeddedNavBar) {
      case EmbeddedNavBar.Close:
        return (
          <View
            style={[styles.top, experimentalSwiper ? styles.experimental : null]}
            testID="Education/top"
          >
            <TopBarIconButton
              testID="Education/CloseIcon"
              onPress={goBack}
              icon={step === 0 ? <Times color={color} /> : <BackChevron color={color} />}
            />
            {experimentalSwiper && (
              <View style={styles.logoContainer}>
                <Animated.View style={logoAnimatedStyle}>
                  <Logo height={60} type={LogoTypes.LIGHT} />
                </Animated.View>
              </View>
            )}
          </View>
        )
      case EmbeddedNavBar.Drawer:
        return <DrawerTopBar testID="DrawerTopBar" />
      default:
        return null
    }
  }

  const isLastStep = step === stepInfo.length

  return (
    <SafeAreaView style={[styles.root, style]} edges={['bottom']} {...passThroughProps}>
      {renderEmbeddedNavBar()}
      <View style={styles.container}>
        <Swiper
          ref={swipeRef}
          onIndexChanged={setStep}
          loop={false}
          dotStyle={dotStyle}
          activeDotStyle={activeDotStyle}
          removeClippedSubviews={false}
        >
          {stepInfo.map((step: EducationStep, i: number) => {
            return (
              <ScrollView
                contentContainerStyle={styles.contentContainer}
                style={styles.swipedContent}
                key={i}
              >
                <View style={styles.swipedContentInner}>
                  {step.isTopTitle && <Logo height={64} />}
                  {step.isTopTitle && <Text style={styles.headingTop}>{step.title}</Text>}
                  {step.image && !experimentalSwiper && (
                    <Image source={step.image} style={styles.bodyImage} resizeMode="contain" />
                  )}
                  {!step.isTopTitle && <Text style={styles.heading}>{step.title}</Text>}
                  {!!step.text && <Text style={styles.bodyText}>{step.text}</Text>}
                </View>
              </ScrollView>
            )
          })}
        </Swiper>
        <Button
          testID="Education/progressButton"
          onPress={nextStep}
          text={isLastStep ? finalButtonText : buttonText}
          type={isLastStep ? finalButtonType : buttonType}
        />
      </View>
    </SafeAreaView>
  )
}

export default Education

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  container: {
    flex: 1,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  heading: {
    marginTop: 24,
    ...fontStyles.h2,
    textAlign: 'center',
  },
  headingTop: {
    ...fontStyles.h1,
    marginTop: 26,
  },
  bodyText: {
    ...fontStyles.regular,
    textAlign: 'center',
    paddingTop: 16,
    marginBottom: 24,
  },
  bodyImage: {
    alignSelf: 'center',
    marginBottom: 24,
    height: '80%',
  },
  swipedContent: {
    marginBottom: 24,
    paddingHorizontal: 24,
    overflow: 'scroll',
  },
  swipedContentInner: {
    width: '100%',
  },
  top: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingVertical: 16,
    flexDirection: 'column',
    width: '100%',
  },
  experimental: {
    height: '50%',
    backgroundColor: colors.greenUI,
  },
  logoContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
})
