import { useFocusEffect } from '@react-navigation/native'
import { StackScreenProps, useHeaderHeight } from '@react-navigation/stack'
import { includes } from 'lodash'
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Modal from 'react-native-modal'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FlatGrid } from 'react-native-super-grid'
import { useDispatch, useSelector } from 'react-redux'
import { addUserInterest, initializeAccount, removeUserInterest } from 'src/account/actions'
import InterestsLearnMoreDialog from 'src/account/InterestsLearnMoreDialog'
import { NuxInterestChoice } from 'src/account/reducer'
import { currentInterestsSelector } from 'src/account/selectors'
import { VerificationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { registrationStepsSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import { isE2EEnv } from 'src/config'
import { setHasSeenVerificationNux } from 'src/identity/actions'
import {
  culture,
  ecosystem,
  governance,
  innovation,
  kolektivoGeneral,
  leadership,
} from 'src/images/Images'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { waitUntilSagasFinishLoading } from 'src/redux/sagas'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import {
  checkIfKomenciAvailable,
  currentStateSelector,
  reset,
  setKomenciContext,
  shouldUseKomenciSelector,
  startKomenciSession,
  StateType,
  stop,
  verificationStatusSelector,
} from 'src/verify/reducer'
import VerificationSkipDialog from 'src/verify/VerificationSkipDialog'

type ScreenProps = StackScreenProps<StackParamList, Screens.NuxInterests>

type Props = ScreenProps

function NuxInterestsScreen({ route, navigation }: Props) {
  const showSkipDialog = route.params?.showSkipDialog || false
  const [showLearnMoreDialog, setShowLearnMoreDialog] = useState(false)
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const partOfOnboarding = !route.params?.hideOnboardingStep
  const currentState = useSelector(currentStateSelector)
  const shouldUseKomenci = useSelector(shouldUseKomenciSelector)
  const verificationStatus = useSelector(verificationStatusSelector)
  const { step, totalSteps } = useSelector(registrationStepsSelector)
  const currentInterests = useSelector(currentInterestsSelector)
  const [allowContinue, showContinue] = useState(false)

  const onPressStart = async () => {
    dispatch(setHasSeenVerificationNux(true))
  }

  const onPressSkipCancel = () => {
    navigation.setParams({ showSkipDialog: false })
  }

  const onPressSkipConfirm = () => {
    dispatch(setHasSeenVerificationNux(true))
    navigateHome()
  }

  const onPressContinue = () => {
    dispatch(setHasSeenVerificationNux(true))
    if (partOfOnboarding) {
      navigate(Screens.OnboardingSuccessScreen)
    } else {
      navigateHome()
    }
  }

  const onPressLearnMore = () => {
    setShowLearnMoreDialog(true)
  }

  const onPressLearnMoreDismiss = () => {
    setShowLearnMoreDialog(false)
  }

  const cancelCaptcha = () => {
    dispatch(stop())
    ValoraAnalytics.track(VerificationEvents.verification_recaptcha_canceled)
  }

  useLayoutEffect(() => {
    const title = route.params?.hideOnboardingStep
      ? t('NuxInterests.title')
      : () => (
          <HeaderTitleWithSubtitle
            title={t('NuxInterests.title')}
            subTitle={t('registrationSteps', { step, totalSteps })}
          />
        )

    navigation.setOptions({
      headerTitle: title,
      headerRight: () =>
        !route.params?.hideOnboardingStep && (
          <TopBarTextButton
            title={t('skip')}
            testID="VerificationEducationSkipHeader"
            onPress={() => navigation.setParams({ showSkipDialog: true })}
            titleStyle={{ color: colors.goldDark }}
          />
        ),
      headerLeft: () => route.params?.hideOnboardingStep && <BackButton />,
    })
  }, [navigation, step, totalSteps, route.params])

  useEffect(() => {
    showContinue(currentInterests.length > 0)
  }, [currentInterests])

  useAsync(async () => {
    await waitUntilSagasFinishLoading()
    dispatch(initializeAccount())
    dispatch(checkIfKomenciAvailable())
  }, [])

  useFocusEffect(
    // useCallback is needed here: https://bit.ly/2G0WKTJ
    useCallback(() => {
      if (shouldUseKomenci !== undefined && verificationStatus.komenci !== shouldUseKomenci) {
        dispatch(reset({ komenci: shouldUseKomenci }))
      }
    }, [shouldUseKomenci])
  )

  const handleUserInterest = (item: NuxInterestChoice) => {
    if (includes(currentInterests, item)) {
      dispatch(removeUserInterest(item))
    } else {
      dispatch(addUserInterest(item))
    }
  }

  const handleCaptchaResolved = (res: any) => {
    const captchaToken = res?.nativeEvent?.data
    if (captchaToken !== 'cancel' && captchaToken !== 'error') {
      Logger.info('Captcha token received: ', captchaToken)
      dispatch(setKomenciContext({ captchaToken }))
      dispatch(startKomenciSession())
      ValoraAnalytics.track(VerificationEvents.verification_recaptcha_success)
    } else {
      dispatch(stop())
      ValoraAnalytics.track(VerificationEvents.verification_recaptcha_failure)
    }
  }

  useEffect(() => {
    if (isE2EEnv && currentState.type === StateType.EnsuringRealHumanUser) {
      handleCaptchaResolved({
        nativeEvent: {
          data: 'special-captcha-bypass-token',
        },
      })
    }
  }, [currentState.type])

  const renderInterestGridItem = ({ item, index }: any) => {
    const isSelected = includes(currentInterests, item.title)
    return (
      <TouchableOpacity
        style={[styles.interestItem, isSelected ? styles.interested : null]}
        onPress={() => handleUserInterest(item.title)}
      >
        <View style={styles.interestRow}>
          <View style={styles.imageRow}>
            <Image source={item.image} style={styles.interestImage} />
          </View>
          <Text style={[styles.interestTitle, isSelected ? styles.interestedTitle : null]}>
            {item.title}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={headerHeight ? { marginTop: headerHeight } : undefined}
        contentContainerStyle={[styles.scrollContainer, insets && { marginBottom: insets.bottom }]}
      >
        <Text style={styles.header} testID="VerificationEducationHeader">
          {t('NuxInterests.header')}
        </Text>
        <Text style={styles.body}>{t('NuxInterests.body')}</Text>
        <FlatGrid data={InterestGridItems} renderItem={renderInterestGridItem} maxItemsPerRow={2} />
        <View style={styles.spacer} />
        <Button
          type={BtnTypes.BRAND_PRIMARY}
          disabled={!allowContinue}
          size={BtnSizes.FULL}
          text={t('continue')}
          onPress={onPressContinue}
        />
        <TextButton
          testID="InterestLearnMore"
          style={styles.learnMoreButton}
          onPress={onPressLearnMore}
        >
          {t('NuxInterests.learnMore')}
        </TextButton>
      </ScrollView>
      <Modal
        isVisible={currentState.type === StateType.EnsuringRealHumanUser}
        style={styles.recaptchaModal}
      >
        <TopBarTextButton
          onPress={cancelCaptcha}
          titleStyle={[
            {
              marginTop: insets.top,
              height: headerHeight - insets.top,
            },
            styles.recaptchaClose,
          ]}
          title={t('close')}
        />
      </Modal>
      <VerificationSkipDialog
        isVisible={showSkipDialog}
        onPressCancel={onPressSkipCancel}
        onPressConfirm={onPressSkipConfirm}
      />
      <InterestsLearnMoreDialog
        isVisible={showLearnMoreDialog}
        onPressDismiss={onPressLearnMoreDismiss}
      />
    </View>
  )
}

NuxInterestsScreen.navigationOptions = nuxNavigationOptions

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  recaptchaModal: {
    margin: 0,
    backgroundColor: 'rgba(249, 243, 240, 0.9)',
  },
  recaptchaClose: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    color: colors.dark,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 32,
  },
  header: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  spacer: {
    flex: 1,
  },
  learnMoreButton: {
    textAlign: 'center',
    color: colors.onboardingBrownLight,
    padding: Spacing.Regular16,
  },
  interestItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 10,
    minHeight: 120,
    backgroundColor: Colors.beige,
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 2,
      height: 2,
    },
    paddingBottom: 10,
  },
  interestRow: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  interestImage: {
    shadowOpacity: 0.1,
    shadowColor: '#FFF',
  },
  interestTitle: {
    ...fontStyles.small,
    textAlign: 'center',
    minHeight: '30%',
  },
  interested: {
    backgroundColor: Colors.greenFaint,
    borderWidth: 1,
    borderColor: Colors.greenStrong,
  },
  interestedTitle: {
    color: Colors.light,
    shadowOpacity: 0.15,
  },
})

const InterestGridItems = [
  {
    title: 'Kolektivo General',
    image: kolektivoGeneral,
  },
  {
    title: 'Leadership and Human Development',
    image: leadership,
  },
  {
    title: 'Equitable Communities & Governance',
    image: governance,
  },
  {
    title: 'Healthy Ecosystems & Environment',
    image: ecosystem,
  },
  {
    title: 'Entrepreneurship & Innovation',
    image: innovation,
  },
  {
    title: 'Creativity, Culture & Arts',
    image: culture,
  },
]

export default NuxInterestsScreen
