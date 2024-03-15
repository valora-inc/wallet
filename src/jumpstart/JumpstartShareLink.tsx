import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import Dialog from 'src/components/Dialog'
import CustomHeader from 'src/components/header/CustomHeader'
import Times from 'src/icons/Times'
import { noHeaderGestureDisabled } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import useBackHandler from 'src/utils/useBackHandler'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartShareLink>

const TAG = 'JumpstartShareLink'

function JumpstartShareLink({ route }: Props) {
  const { tokenId, link } = route.params

  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const shouldNavigate = useRef(false)
  const [showNavigationWarning, setShowNavigationWarning] = useState(false)

  const token = useTokenInfo(tokenId)

  useBackHandler(() => {
    if (!showNavigationWarning) {
      setShowNavigationWarning(true)
    }
    return true
  }, [])

  const handleShowNavigationWarning = () => {
    setShowNavigationWarning(true)
  }

  const handleConfirmNavigation = () => {
    // calling navigateHome directly from this function causes an app crash,
    // possibly because of the race condition between navigation and unmounting
    // the Dialog (Modal). Using a ref to track the user's intention to navigate
    // as a quick fix here, as we plan to remove the use of the Dialog soon.
    setShowNavigationWarning(false)
    shouldNavigate.current = true
  }

  const handleDismissNavigationWarning = () => {
    setShowNavigationWarning(false)
  }

  const handleNavigation = () => {
    if (shouldNavigate.current) {
      navigateHome()
    }
  }

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaContainer}>
      <CustomHeader
        style={styles.customHeader}
        left={<TopBarIconButton icon={<Times />} onPress={handleShowNavigationWarning} />}
      />
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, Spacing.Thick24) },
        ]}
      >
        <Text style={styles.title}>{t('jumpstartShareLinkScreen.title')}</Text>
        <Text style={styles.description}>
          {t('jumpstartShareLinkScreen.description', { tokenSymbol: token.symbol })}
        </Text>
        <DataFieldWithCopy
          label={t('jumpstartShareLinkScreen.linkLabel')}
          value={link}
          copySuccessMessage={t('jumpstartShareLinkScreen.linkCopiedMessage')}
          testID="JumpstartShareLink/LiveLink"
        />
        <Dialog
          title={t('jumpstartShareLinkScreen.navigationWarning.title')}
          isVisible={showNavigationWarning}
          actionText={t('jumpstartShareLinkScreen.navigationWarning.ctaDoNotNavigate')}
          actionPress={handleDismissNavigationWarning}
          testID="JumpstartShareLink/ConfirmNavigationDialog"
          secondaryActionText={t('jumpstartShareLinkScreen.navigationWarning.ctaNavigate')}
          secondaryActionPress={handleConfirmNavigation}
          onDialogHide={handleNavigation}
        >
          <Text style={styles.description}>
            {t('jumpstartShareLinkScreen.navigationWarning.description')}
          </Text>
        </Dialog>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  customHeader: {
    paddingHorizontal: Spacing.Thick24,
  },
  contentContainer: {
    padding: Spacing.Thick24,
    flexGrow: 1,
  },
  title: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodyMedium,
    marginBottom: Spacing.Large32,
  },
})

JumpstartShareLink.navigationOptions = () => ({
  ...noHeaderGestureDisabled,
})

export default JumpstartShareLink
