import { throttle } from 'lodash'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import SelectRecipientButton from 'src/components/SelectRecipientButton'
import CircledIcon from 'src/icons/CircledIcon'
import QRCode from 'src/icons/QRCode'
import Social from 'src/icons/Social'
import Times from 'src/icons/Times'
import { importContacts } from 'src/identity/actions'
import { RecipientVerificationStatus } from 'src/identity/types'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import RecipientPicker from 'src/recipients/RecipientPickerV2'
import { sortRecipients } from 'src/recipients/recipient'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { SendSelectRecipientSearchInput } from 'src/send/SendSelectRecipientSearchInput'
import useFetchRecipientVerificationStatus from 'src/send/useFetchRecipientVerificationStatus'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { requestContactsPermission } from 'src/utils/permissions'

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
      <View>
        <Text style={getStartedStyles.subtitle}>
          {t('sendSelectRecipient.getStarted.subtitle')}
        </Text>
        <Text style={getStartedStyles.title}>{t('sendSelectRecipient.getStarted.title')}</Text>
      </View>
      {options.map((params) => renderOption(params))}
    </View>
  )
}

const getStartedStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray1,
    padding: Spacing.Thick24,
    margin: Spacing.Thick24,
    marginTop: 44,
    borderRadius: 10,
    gap: Spacing.Regular16,
  },
  subtitle: {
    ...typeScale.labelXXSmall,
    color: colors.gray3,
  },
  title: {
    ...typeScale.labelMedium,
    color: colors.gray5,
  },
  optionWrapper: {
    flexDirection: 'row',
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
    paddingLeft: Spacing.Smallest8,
    flex: 1,
  },
  optionTitle: {
    ...typeScale.labelSmall,
    color: colors.gray5,
    paddingBottom: Spacing.Tiny4,
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

  const [showContacts, setShowContacts] = useState(false)

  const recentRecipients = useSelector((state) => state.send.recentRecipients)
  const contactsCache = useSelector(phoneRecipientCacheSelector)
  const contactRecipients = useMemo(
    () => sortRecipients(Object.values(contactsCache)),
    [contactsCache]
  )
  const showGetStarted = !recentRecipients.length

  const { recipientVerificationStatus, recipient, setSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const dispatch = useDispatch()

  const onPressContacts = async () => {
    ValoraAnalytics.track(SendEvents.send_select_recipient_contacts)
    const permissionGranted = await requestContactsPermission()
    // TODO(satish): show modal if permissions are rejected
    if (permissionGranted) {
      dispatch(importContacts())
      setShowContacts(true)
    }
  }

  const onPressQR = () => {
    ValoraAnalytics.track(SendEvents.send_select_recipient_scan_qr)
    navigate(Screens.QRNavigator, {
      screen: Screens.QRScanner,
    })
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
        {showContacts ? (
          <>
            <View style={styles.topSection}>
              <Text style={styles.title}>{t('sendSelectRecipient.contactsTitle')}</Text>
            </View>
            <RecipientPicker
              testID={'SelectRecipient/ContactRecipientPicker'}
              recipients={contactRecipients}
              onSelectRecipient={setSelectedRecipient}
              selectedRecipient={recipient}
              isSelectedRecipientLoading={
                !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
              }
            />
          </>
        ) : (
          <>
            <View style={styles.topSection}>
              <Text style={styles.title}>{t('sendSelectRecipient.title')}</Text>
              <SelectRecipientButton
                testID={'SelectRecipient/QR'}
                title={t('sendSelectRecipient.qr.title')}
                subtitle={t('sendSelectRecipient.qr.subtitle')}
                onPress={onPressQR}
                icon={<QRCode />}
              />
              <SelectRecipientButton
                testID={'SelectRecipient/Contacts'}
                title={t('sendSelectRecipient.invite.title')}
                subtitle={t('sendSelectRecipient.invite.subtitle')}
                onPress={onPressContacts}
                icon={<Social />}
              />
            </View>
            {showGetStarted ? (
              <GetStartedSection />
            ) : (
              <RecipientPicker
                testID={'SelectRecipient/RecentRecipientPicker'}
                recipients={recentRecipients}
                title={t('sendSelectRecipient.recents')}
                onSelectRecipient={setSelectedRecipient}
                selectedRecipient={recipient}
                isSelectedRecipientLoading={
                  !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
                }
                style={styles.recentRecipientPicker}
              />
            )}
          </>
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
    paddingTop: Spacing.Thick24,
    paddingBottom: Spacing.Regular16,
    color: colors.dark,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  topSection: {
    paddingHorizontal: Spacing.Thick24,
  },
  content: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  recentRecipientPicker: {
    paddingTop: Spacing.Large32,
  },
  buttonContainer: {
    padding: variables.contentPadding,
    paddingLeft: Spacing.Thick24,
  },
})

export default SendSelectRecipient
