import { anonymizedPhone } from '@celo/base/lib/phoneNumbers'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { e164NumberSelector, nameSelector } from 'src/account/selectors'
import { sendSupportRequest } from 'src/account/zendesk'
import { showMessage } from 'src/alert/actions'
import {
  multichainBetaStatusSelector,
  phoneNumberVerifiedSelector,
  sessionIdSelector,
} from 'src/app/selectors'
import { APP_NAME } from 'src/brandingConfig'
import Button, { BtnTypes } from 'src/components/Button'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import Switch from 'src/components/Switch'
import TextInput from 'src/components/TextInput'
import { DEFAULT_TESTNET } from 'src/config'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { hooksPreviewApiUrlSelector } from 'src/positions/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
type Props = NativeStackScreenProps<StackParamList, Screens.SupportContact>

// Language agnostic loose regex for email validation
const tester =
  /^[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~\u0E00-\u0E7F](\.?[-!#$%&'*+/0-9=?A-Z^_a-z`{|}~\u0E00-\u0E7F])*@[A-Za-z0-9\u0E00-\u0E7F](-*\.?[A-Za-z0-9\u0E00-\u0E7F])*\.[A-Za-z\u0E00-\u0E7F](-?[A-Za-z0-9\u0E00-\u0E7F])+$/
// Validate email function - https://github.com/manishsaraan/email-validator
export function validateEmail(email: string) {
  if (!email) return false
  if (email.length > 360) return false
  const emailParts = email.split('@')
  if (emailParts.length !== 2) return false
  const account = emailParts[0]
  const address = emailParts[1]
  if (account.length > 64) return false
  else if (address.length > 255) return false
  const domainParts = address.split('.')
  if (!domainParts[1] || domainParts[1].length < 2) return false
  if (
    domainParts.some((part) => {
      return part.length > 63
    })
  ) {
    return false
  }

  return tester.test(email)
}

function SupportContact({ route }: Props) {
  const { t } = useTranslation()
  const cachedName = useSelector(nameSelector)

  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState(cachedName ?? '')
  const [attachLogs, setAttachLogs] = useState(true)
  const [inProgress, setInProgress] = useState(false)

  const e164PhoneNumber = useSelector(e164NumberSelector)
  const currentAccount = useSelector(currentAccountSelector)
  const sessionId = useSelector(sessionIdSelector)
  const numberVerifiedCentralized = useSelector(phoneNumberVerifiedSelector)
  const multichainBetaStatus = useSelector(multichainBetaStatusSelector)
  const { countryCodeAlpha2: country, region } = useSelector(userLocationDataSelector)
  const hooksPreviewApiUrl = useSelector(hooksPreviewApiUrlSelector)
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
      systemVersion: DeviceInfo.getSystemVersion(),
      buildNumber: DeviceInfo.getBuildNumber(),
      apiLevel: DeviceInfo.getApiLevelSync(),
      os: Platform.OS,
      country,
      region,
      deviceId: DeviceInfo.getDeviceId(),
      deviceBrand: DeviceInfo.getBrand(),
      deviceModel: DeviceInfo.getModel(),
      address: currentAccount,
      sessionId,
      numberVerifiedCentralized,
      multichainBetaStatus,
      hooksPreviewEnabled: !!hooksPreviewApiUrl,
      network: DEFAULT_TESTNET,
    }
    const userId = e164PhoneNumber ? anonymizedPhone(e164PhoneNumber) : t('unknown')
    const attachments = attachLogs ? await Logger.getLogsToAttach() : []
    try {
      await sendSupportRequest({
        message,
        deviceInfo,
        logFiles: attachments,
        userEmail: email,
        userName: name,
        subject: t('supportEmailSubject', { appName: APP_NAME, user: userId }),
      })
      // Used to prevent flickering of the activity indicator on quick uploads
      // Also navigateBackAndToast is a bit slow, so the timeout helps ensure that the loadingSpinner stays until the user is redirected
      setTimeout(() => setInProgress(false), 1000)
      navigateBackAndToast()
    } catch (error) {
      Logger.error('SupportContact', 'Error while sending logs to support', error)
    }
  }, [message, attachLogs, e164PhoneNumber, email, name])

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
          placeholderTextColor={colors.gray4}
          underlineColorAndroid="transparent"
          numberOfLines={10}
          placeholder={t('contactMessagePlaceholder') ?? undefined}
          showClearButton={false}
          testID={'MessageEntry'}
        />
        <Text style={styles.headerText}>{t('Name')}</Text>
        <TextInput
          onChangeText={setName}
          multiline={false}
          value={name}
          style={styles.singleLineTextInput}
          showClearButton={false}
          testID={'NameEntry'}
        />
        <Text style={styles.headerText}>{t('Email')}</Text>
        <TextInput
          textContentType="emailAddress"
          keyboardType="email-address"
          autoComplete="email"
          onChangeText={setEmail}
          multiline={false}
          value={email}
          style={styles.singleLineTextInput}
          placeholderTextColor={colors.gray4}
          placeholder={t('Email') ?? undefined}
          showClearButton={false}
          testID={'EmailEntry'}
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
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}

        <View style={styles.disclaimer}>
          <Text testID="Legal" style={styles.disclaimerText}>
            {t('supportLegalCheckbox')}
          </Text>
        </View>
        <Button
          disabled={!message || inProgress || !name || !email || !validateEmail(email)}
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
    color: colors.gray4,
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
    marginBottom: 16,
    color: colors.black,
    height: 80,
    maxHeight: 150,
  },
  singleLineTextInput: {
    ...fontStyles.regular,
    paddingHorizontal: 12,
    marginTop: 8,
    alignItems: 'flex-start',
    borderColor: colors.gray2,
    borderRadius: 4,
    borderWidth: 1.5,
    marginBottom: 16,
    color: colors.black,
    maxHeight: 50,
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
