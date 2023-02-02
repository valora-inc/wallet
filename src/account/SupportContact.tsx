import { anonymizedPhone } from '@celo/base/lib/phoneNumbers'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { useDispatch, useSelector } from 'react-redux'
import { Email, sendEmail } from 'src/account/emailSender'
import { e164NumberSelector } from 'src/account/selectors'
import { showMessage } from 'src/alert/actions'
import {
  numberVerifiedCentrallySelector,
  numberVerifiedSelector,
  sessionIdSelector,
} from 'src/app/selectors'
import { APP_NAME } from 'src/brandingConfig'
import Button, { BtnTypes } from 'src/components/Button'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import Switch from 'src/components/Switch'
import TextInput from 'src/components/TextInput'
import { CELO_SUPPORT_EMAIL_ADDRESS, DEFAULT_TESTNET } from 'src/config'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.SupportContact>

function SupportContact({ route }: Props) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [attachLogs, setAttachLogs] = useState(true)
  const [inProgress, setInProgress] = useState(false)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const currentAccount = useSelector(currentAccountSelector)
  const sessionId = useSelector(sessionIdSelector)
  const numberVerifiedDecentralized = useSelector(numberVerifiedSelector)
  const numberVerifiedCentralized = useSelector(numberVerifiedCentrallySelector)
  const dispatch = useDispatch()

  const prefilledText = route.params?.prefilledText
  useEffect(() => {
    if (prefilledText) {
      setMessage(prefilledText)
    }
  }, [prefilledText])

  const navigateBackAndToast = () => {
    navigateBack()
    dispatch(showMessage(t('contactSuccess')))
  }

  const onPressSendEmail = useCallback(async () => {
    setInProgress(true)
    const deviceInfo = {
      version: DeviceInfo.getVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      apiLevel: DeviceInfo.getApiLevelSync(),
      deviceId: DeviceInfo.getDeviceId(),
      deviceBrand: DeviceInfo.getBrand(),
      deviceModel: DeviceInfo.getModel(),
      address: currentAccount,
      sessionId,
      numberVerifiedDecentralized,
      numberVerifiedCentralized,
      network: DEFAULT_TESTNET,
    }
    const userId = e164PhoneNumber ? anonymizedPhone(e164PhoneNumber) : t('unknown')
    const email: Email = {
      subject: t('supportEmailSubject', { appName: APP_NAME, user: userId }),
      recipients: [CELO_SUPPORT_EMAIL_ADDRESS],
      body: `${message}<br/><br/><b>${JSON.stringify(deviceInfo)}</b>`,
      isHTML: true,
    }
    let attachments: Email['attachments']
    if (attachLogs) {
      attachments = await Logger.getLogsToAttach()
      if (attachments) {
        email.attachments = attachments
        email.body += (email.body ? '<br/><br/>' : '') + '<b>Support logs are attached...</b>'
      }
    }
    // Used to prevent flickering of the activity indicator on quick uploads
    setTimeout(() => setInProgress(false), 1000)
    try {
      await sendEmail(
        email,
        deviceInfo,
        // Get the current months log file to attach as text if sendEmailWithNonNativeApp is used
        attachments
          ? attachments.find(
              (attachment: { name: string }) => attachment.name === Logger.getCurrentLogFileName()
            )?.path ?? false
          : false
      )
      navigateBackAndToast()
    } catch (error) {
      Logger.error('SupportContact', 'Error while sending logs to support', error)
    }
  }, [message, attachLogs, e164PhoneNumber])

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={styles.title} testID={'ContactTitle'}>
          {t('contact')}
        </Text>
        <Text style={styles.headerText}>{t('message')}</Text>
        <TextInput
          onChangeText={setMessage}
          value={message}
          multiline={true}
          style={styles.messageTextInput}
          placeholderTextColor={colors.gray600}
          underlineColorAndroid="transparent"
          numberOfLines={10}
          placeholder={t('contactMessagePlaceholder')}
          showClearButton={false}
          testID={'MessageEntry'}
        />
        <View style={styles.attachLogs}>
          <Switch
            testID="SwitchLogs"
            style={styles.logsSwitch}
            value={attachLogs}
            onValueChange={setAttachLogs}
          />
          <Text style={fontStyles.regular}>{t('attachLogs')}</Text>
        </View>
        {inProgress && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.greenBrand} />
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text testID="Legal" style={styles.disclaimerText}>
            {t('supportLegalCheckbox')}
          </Text>
        </View>
        <Button
          disabled={!message || inProgress}
          onPress={onPressSendEmail}
          text={t('submit')}
          type={BtnTypes.PRIMARY}
          testID="SubmitContactForm"
        />
      </ScrollView>
      <KeyboardSpacer />
    </View>
  )
}

const styles = StyleSheet.create({
  disclaimer: {
    marginBottom: 24,
  },
  disclaimerText: {
    ...fontStyles.small,
    color: colors.gray600,
  },
  container: {
    flex: 1,
  },
  innerContainer: {
    flexGrow: 1,
    padding: 16,
  },
  attachLogs: {
    flexShrink: 0,
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    marginTop: 4,
  },
  logsSwitch: {
    marginBottom: 3,
    marginRight: 10,
  },
  messageTextInput: {
    ...fontStyles.regular,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.gray2,
    borderRadius: 4,
    borderWidth: 1.5,
    marginBottom: 4,
    color: colors.dark,
    height: 80,
    maxHeight: 150,
  },
  headerText: {
    ...fontStyles.small600,
  },
  loadingSpinnerContainer: {
    marginVertical: 20,
  },
  title: {
    ...fontStyles.h1,
    marginVertical: 16,
  },
})

export default SupportContact
