import * as React from 'react'
import {
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import { NativeSafeAreaViewProps, SafeAreaView } from 'react-native-safe-area-context'
import Swiper from 'react-native-swiper'
import Button, { BtnTypes } from 'src/components/Button'
import BackChevron from 'src/icons/BackChevron'
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

export enum NotificationTopic {
  cico = 'cico',
}

interface NotificationStep {
  image: ImageSourcePropType | null
  topic: NotificationTopic
  title: string
  // If set to true, title is displayed at the top
  isTopTitle?: boolean
  text?: string
}

export type Props = NativeSafeAreaViewProps & {
  embeddedNavBar: EmbeddedNavBar | null
  stepInfo: NotificationStep[]
  buttonType: BtnTypes
  buttonText: string
  finalButtonType: BtnTypes
  finalButtonText: string
  dotStyle: StyleProp<ViewStyle>
  activeDotStyle: StyleProp<ViewStyle>
  onFinish: () => void
}

interface State {
  step: number
}

export default class KolektivoNotification extends React.Component<Props, State> {
  static defaultProps = {
    buttonType: BtnTypes.SECONDARY,
    finalButtonType: BtnTypes.PRIMARY,
    dotStyle: progressDots.circlePassive,
    activeDotStyle: progressDots.circleActive,
  }

  state = {
    step: 0,
  }

  swiper = React.createRef<Swiper>()

  goBack = () => {
    const { step } = this.state
    if (step === 0) {
      navigateBack()
    } else {
      this.swiper?.current?.scrollBy(-1, true)
    }
  }

  setStep = (step: number) => {
    this.setState({ step })
  }

  nextStep = () => {
    const { step } = this.state
    const isLastStep = step === this.props.stepInfo.length - 1

    if (isLastStep) {
      this.props.onFinish()
    } else {
      this.swiper?.current?.scrollBy(1, true)
    }
  }

  renderEmbeddedNavBar() {
    switch (this.props.embeddedNavBar) {
      case EmbeddedNavBar.Close:
        return (
          <View style={styles.top} testID="KolektivoNotification/top">
            <TopBarIconButton
              testID="KolektivoNotification/CloseIcon"
              onPress={this.goBack}
              icon={this.state.step === 0 ? <Times /> : <BackChevron color={colors.dark} />}
            />
          </View>
        )
      case EmbeddedNavBar.Drawer:
        return <DrawerTopBar testID="DrawerTopBar" />
      default:
        return null
    }
  }

  render() {
    const {
      style,
      embeddedNavBar,
      stepInfo,
      buttonType,
      buttonText,
      finalButtonType,
      finalButtonText,
      dotStyle,
      activeDotStyle,
      ...passThroughProps
    } = this.props
    const isLastStep = this.state.step === stepInfo.length - 1
    // @todo Replace screen layout with a better layout
    return (
      <SafeAreaView style={[styles.root, style]} {...passThroughProps}>
        {this.renderEmbeddedNavBar()}
        <View style={styles.container}>
          <Swiper
            ref={this.swiper}
            onIndexChanged={this.setStep}
            loop={false}
            dotStyle={dotStyle}
            activeDotStyle={activeDotStyle}
            removeClippedSubviews={false}
          >
            {stepInfo.map((step: NotificationStep, i: number) => {
              return (
                <ScrollView
                  contentContainerStyle={styles.contentContainer}
                  style={styles.swipedContent}
                  key={i}
                >
                  <View style={styles.swipedContentInner}>
                    {/* {step.isTopTitle && <Logo height={64} />} */}
                    {step.isTopTitle && <Text style={styles.headingTop}>{step.title}</Text>}
                    {step.image && (
                      <Image source={step.image} style={styles.bodyImage} resizeMode="contain" />
                    )}
                    {/* {!step.isTopTitle && <Logo height={50} />} */}
                    {!step.isTopTitle && <Text style={styles.heading}>{step.title}</Text>}
                    {!!step.text && <Text style={styles.bodyText}>{step.text}</Text>}
                  </View>
                </ScrollView>
              )
            })}
          </Swiper>
          <Button
            testID="Education/progressButton"
            onPress={this.nextStep}
            text={isLastStep ? finalButtonText : buttonText}
            type={isLastStep ? finalButtonType : buttonType}
          />
        </View>
      </SafeAreaView>
    )
  }
}

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
    textAlign: 'left',
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
  },
  swipedContent: {
    marginBottom: 24,
    paddingHorizontal: 24,
    overflow: 'scroll',
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
})
