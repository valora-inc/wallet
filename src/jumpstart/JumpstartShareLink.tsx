import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
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
  const { tokenId, sendAmount, link } = route.params
  const parsedAmount = new BigNumber(sendAmount)
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const token = useTokenInfo(tokenId)

  const [showConfirmNavigate, setShowConfirmNavigate] = useState(false)

  const handleConfirmNavigate = () => {
    setShowConfirmNavigate(true)
  }

  const handleNavigate = () => {
    navigateHome()
  }

  useBackHandler(() => {
    if (!showConfirmNavigate) {
      setShowConfirmNavigate(true)
    }
    return true
  }, [])

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaContainer}>
      <CustomHeader
        style={styles.customHeader}
        left={<TopBarIconButton icon={<Times />} onPress={handleConfirmNavigate} />}
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
          testID="WalletConnectRequest/ActionRequestPayload"
        />
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
