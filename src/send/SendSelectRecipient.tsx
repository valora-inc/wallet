import { throttle } from 'lodash'
import React, { useState } from 'react'
import { Screens } from 'src/navigator/Screens'
import { noHeader } from 'src/navigator/Headers'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Times from 'src/icons/Times'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import variables from 'src/styles/variables'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { SendEvents } from 'src/analytics/Events'
import { SendSelectRecipientSearchInput } from 'src/send/SendSelectRecipientSearchInput'
import { useTranslation } from 'react-i18next'
import { typeScale } from 'src/styles/fonts'
import SelectRecipientButton from 'src/components/SelectRecipientButton'
import QRCode from 'src/icons/QRCode'
import Social from 'src/icons/Social'
import colors from 'src/styles/colors'
import CircledIcon from 'src/icons/CircledIcon'
import { useDispatch } from 'react-redux'
import { useAsync } from 'react-async-hook'
import { importContacts } from 'src/identity/actions'
import { requestContactsPermission } from 'src/utils/permissions'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import useSelector from 'src/redux/useSelector'
import RecipientPicker, { Section } from 'src/recipients/RecipientPicker'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import useFetchRecipientVerificationStatus from 'src/send/useFetchRecipientVerificationStatus'

const SEARCH_THROTTLE_TIME = 100

function GetStartedSection() {
  const { t } = useTranslation()

  const renderOption = ({
    optionNum,
    title,
    subtitle,
  }: {
    optionNum: string
    title: string
    subtitle: string
  }) => {
    return (
      <View key={`getStartedOption-${optionNum}`} style={getStartedStyles.optionWrapper}>
        <CircledIcon radius={24} style={getStartedStyles.optionNum} backgroundColor={colors.white}>
          <Text style={getStartedStyles.optionNumText}>{optionNum}</Text>
        </CircledIcon>
        <View style={getStartedStyles.optionText}>
          <Text style={getStartedStyles.optionTitle}>{title}</Text>
          <Text style={getStartedStyles.optionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    )
  }

  const options = [
    {
      optionNum: '1',
      title: t('sendSelectRecipient.getStarted.options.one.title'),
      subtitle: t('sendSelectRecipient.getStarted.options.one.subtitle'),
    },
    {
      optionNum: '2',
      title: t('sendSelectRecipient.getStarted.options.two.title'),
      subtitle: t('sendSelectRecipient.getStarted.options.two.subtitle'),
    },
    {
      optionNum: '3',
      title: t('sendSelectRecipient.getStarted.options.three.title'),
      subtitle: t('sendSelectRecipient.getStarted.options.three.subtitle'),
    },
    {
      optionNum: '4',
      title: t('sendSelectRecipient.getStarted.options.four.title'),
      subtitle: t('sendSelectRecipient.getStarted.options.four.subtitle'),
    },
  ]

  return (
    <View style={getStartedStyles.container} testID={'SelectRecipient/GetStarted'}>
      <Text style={getStartedStyles.subtitle}>{t('sendSelectRecipient.getStarted.subtitle')}</Text>
      <Text style={getStartedStyles.title}>{t('sendSelectRecipient.getStarted.title')}</Text>
      {options.map((params) => renderOption(params))}
    </View>
  )
}

const getStartedStyles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    backgroundColor: colors.gray1,
    padding: 24,
    margin: 24,
    borderRadius: 10,
  },
  subtitle: {
    ...typeScale.labelXXSmall,
    color: colors.gray3,
  },
  title: {
    ...typeScale.labelMedium,
    color: colors.gray5,
    paddingBottom: 10,
  },
  optionWrapper: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  optionNum: {
    borderWidth: 1,
    borderColor: colors.gray2,
  },
  optionNumText: {
    ...typeScale.labelXSmall,
    color: colors.dark,
  },
  optionText: {
    paddingLeft: 10,
    flexDirection: 'column',
  },
  optionTitle: {
    ...typeScale.labelSmall,
    color: colors.gray5,
    paddingBottom: 5,
  },
  optionSubtitle: {
    ...typeScale.bodyXSmall,
    color: colors.gray3,
  },
})

function SendSelectRecipient() {
  const { t } = useTranslation()

  const [searchQuery, setSearchQuery] = useState('')
  const throttledSearch = throttle((searchInput: string) => {
    setSearchQuery(searchInput)
  }, SEARCH_THROTTLE_TIME)

  const [shouldImportContacts, setShouldImportContacts] = useState(false)

  const recentRecipients = useSelector((state) => state.send.recentRecipients)
  const showGetStarted = !recentRecipients.length

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)

  const { recipientVerificationStatus, recipient, setSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const dispatch = useDispatch()

  useAsync(async () => {
    if (shouldImportContacts) {
      // TODO (ACT-949): Currently if a user does not have a phone number linked, this silently fails
      const permissionGranted = await requestContactsPermission()
      if (permissionGranted) {
        dispatch(importContacts())
      }
      setShouldImportContacts(false)
    }
  }, [shouldImportContacts])

  const onPressContacts = () => {
    ValoraAnalytics.track(SendEvents.send_select_recipient_invite)
    setShouldImportContacts(true)
  }

  const onPressQR = () => {
    ValoraAnalytics.track(SendEvents.send_select_recipient_scan_qr)
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })
  }

  const sections: Section[] = []
  if (recentRecipients.length) {
    sections.push({ key: t('sendRedesign.recents'), data: recentRecipients })
  }

  return (
    <SafeAreaView style={styles.body} edges={['top']}>
      <View style={styles.header}>
        <TopBarIconButton
          icon={<Times />}
          onPress={navigateBack}
          eventName={SendEvents.send_cancel}
          style={styles.buttonContainer}
        />
        <SendSelectRecipientSearchInput input={searchQuery} onChangeText={throttledSearch} />
      </View>
      <View style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.title}>{t('sendSelectRecipient.title')}</Text>
          <SelectRecipientButton
            testID={'SelectRecipient/QR'}
            title={t('sendSelectRecipient.qr.title')}
            subtitle={t('sendSelectRecipient.qr.subtitle')}
            onPress={onPressQR}
            icon=<QRCode />
          />
          <SelectRecipientButton
            testID={'SelectRecipient/Invite'}
            title={t('sendSelectRecipient.invite.title')}
            subtitle={t('sendSelectRecipient.invite.subtitle')}
            onPress={onPressContacts}
            icon=<Social />
          />
        </View>
        {showGetStarted ? (
          <View style={styles.getStartedWrapper}>
            <GetStartedSection />
          </View>
        ) : (
          <View style={styles.recipientWrapper}>
            <RecipientPicker
              testID={'SelectRecipient/RecipientPicker'}
              sections={sections}
              searchQuery={searchQuery}
              defaultCountryCode={defaultCountryCode}
              onSelectRecipient={setSelectedRecipient}
              selectedRecipient={recipient}
              recipientVerificationStatus={recipientVerificationStatus}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

SendSelectRecipient.navigationOptions = {
  ...noHeader,
  ...Platform.select({
    ios: { animation: 'slide_from_bottom' },
  }),
}

const styles = StyleSheet.create({
  title: {
    ...typeScale.titleSmall,
    paddingTop: 24,
    paddingBottom: 16,
    color: colors.dark,
  },
  header: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
  },
  topSection: {
    paddingHorizontal: 24,
  },
  getStartedWrapper: {
    marginTop: 'auto',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  body: {
    flex: 1,
  },
  recipientWrapper: {
    flex: 1,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    padding: variables.contentPadding,
    paddingLeft: 24,
  },
})

export default SendSelectRecipient
