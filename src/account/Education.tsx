import React, { useEffect, useRef, useState } from 'react'
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { NativeSafeAreaViewProps, SafeAreaView } from 'react-native-safe-area-context'
import { OnboardingEvents } from 'src/analytics/Events'
import { ScrollDirection } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnTypes } from 'src/components/Button'
import Pagination from 'src/components/Pagination'
import BackChevron from 'src/icons/BackChevron'
import Times from 'src/icons/Times'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigateBack } from 'src/navigator/NavigationService'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import progressDots from 'src/styles/progressDots'
import variables from 'src/styles/variables'

export enum EmbeddedNavBar {
  Close = 'Close',
  Drawer = 'Drawer',
}

export enum EducationTopic {
  onboarding = 'onboarding',
  backup = 'backup',
  celo = 'celo',
}

interface EducationStep {
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
}

const Education = (props: Props) => {
  const {
    style,
    embeddedNavBar,
    stepInfo,
    buttonType = BtnTypes.SECONDARY,
    buttonText,
    finalButtonType = BtnTypes.PRIMARY,
    finalButtonText,
    dotStyle = progressDots.circlePassive,
    activeDotStyle = progressDots.circleActive,
    onFinish,
    ...passThroughProps
  } = props

  const [currentIndex, setCurrentIndex] = useState(0)
  // This variable tracks the last scrolled to carousel screen, so that impression
  // events are not dispatched twice for the same carousel screen
  const lastViewedIndex = useRef(-1)
  // Scroll View Ref for button clicks
  const scrollViewRef = useRef<ScrollView>(null)

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const { topic } = stepInfo[currentIndex]
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / variables.width)
    if (nextIndex === currentIndex) {
      return
    }

    const direction = nextIndex > currentIndex ? ScrollDirection.next : ScrollDirection.previous
    if (topic === EducationTopic.backup) {
      ValoraAnalytics.track(OnboardingEvents.backup_education_scroll, {
        currentStep: currentIndex,
        direction: direction,
      })
    } else if (topic === EducationTopic.celo) {
      ValoraAnalytics.track(OnboardingEvents.celo_education_scroll, {
        currentStep: currentIndex,
        direction: direction,
      })
    } else if (topic === EducationTopic.onboarding) {
      ValoraAnalytics.track(OnboardingEvents.onboarding_education_scroll, {
        currentStep: currentIndex,
        direction: direction,
      })
    }

    setCurrentIndex(Math.round(event.nativeEvent.contentOffset.x / variables.width))
  }

  useEffect(() => {
    const { topic } = stepInfo[currentIndex]
    if (stepInfo.length > 0 && lastViewedIndex.current < currentIndex) {
      lastViewedIndex.current = currentIndex
    }
    if (topic === EducationTopic.onboarding) {
      ValoraAnalytics.track(OnboardingEvents.onboarding_education_step_impression, {
        step: currentIndex,
      })
    }
  }, [currentIndex])

  if (!stepInfo.length) {
    // No Steps, no slider
    return null
  }

  const goBack = () => {
    const { topic } = stepInfo[currentIndex]
    if (currentIndex === 0) {
      if (topic === EducationTopic.backup) {
        ValoraAnalytics.track(OnboardingEvents.backup_education_cancel)
      } else if (topic === EducationTopic.celo) {
        ValoraAnalytics.track(OnboardingEvents.celo_education_cancel)
      }
      navigateBack()
    } else {
      scrollViewRef.current?.scrollTo({ x: variables.width * (currentIndex - 1), animated: true })
    }
  }

  const nextStep = () => {
    // If we are on the last step, call the onFinish function otherwise scroll to the next step
    currentIndex === stepInfo.length - 1
      ? onFinish()
      : scrollViewRef.current?.scrollTo({ x: variables.width * (currentIndex + 1), animated: true })
  }

  const renderEmbeddedNavBar = () => {
    switch (embeddedNavBar) {
      case EmbeddedNavBar.Close:
        return (
          <View style={styles.top} testID="Education/top">
            <TopBarIconButton
              testID={`Education/${currentIndex === 0 ? 'Close' : 'Back'}Icon`}
              onPress={goBack}
              icon={currentIndex === 0 ? <Times /> : <BackChevron color={colors.black} />}
            />
          </View>
        )
      case EmbeddedNavBar.Drawer:
        return <DrawerTopBar testID="DrawerTopBar" />
      default:
        return null
    }
  }

  return (
    <SafeAreaView testID="Education" style={[styles.root, style]} {...passThroughProps}>
      {renderEmbeddedNavBar()}
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          horizontal={true}
          pagingEnabled={true}
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          testID="ScrollContainer"
        >
          {stepInfo.map((step: EducationStep, i: number) => (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
              style={styles.swipedContent}
              key={i}
            >
              {step.isTopTitle && <Text style={styles.headingTop}>{step.title}</Text>}
              <View style={styles.swipedContentInner}>
                {step.image && (
                  <Image source={step.image} style={styles.bodyImage} resizeMode="contain" />
                )}
                {!step.isTopTitle && <Text style={styles.heading}>{step.title}</Text>}
                {!!step.text && <Text style={styles.bodyText}>{step.text}</Text>}
              </View>
            </ScrollView>
          ))}
        </ScrollView>
        <Pagination
          style={styles.pagination}
          count={stepInfo.length}
          activeIndex={currentIndex}
          dotStyle={dotStyle}
          activeDotStyle={activeDotStyle}
        />
        <Button
          testID="Education/progressButton"
          onPress={nextStep}
          text={currentIndex === stepInfo.length - 1 ? finalButtonText : buttonText}
          type={currentIndex === stepInfo.length - 1 ? finalButtonType : buttonType}
          touchableStyle={
            currentIndex === stepInfo.length - 1 ? { backgroundColor: '#EEB93C' } : undefined
          }
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    paddingHorizontal: 12,
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
    alignSelf: 'flex-start',
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
  },
  swipedContent: {
    width: variables.width - 2 * variables.contentPadding,
    margin: variables.contentPadding,
  },
  swipedContentInner: {
    flex: 1,
    justifyContent: 'center',
  },
  top: {
    paddingLeft: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    width: '100%',
  },
  pagination: {
    paddingBottom: variables.contentPadding,
  },
})

export default Education
