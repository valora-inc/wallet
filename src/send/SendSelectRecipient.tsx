import { throttle } from 'lodash'
import { parsePhoneNumber } from '@celo/phone-utils'
import React, { useMemo, useState, useCallback, useEffect } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
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
import { resolveId } from 'src/recipients/RecipientPicker'
import {
  sortRecipients,
  getRecipientFromAddress,
  Recipient,
  RecipientType,
  filterRecipientFactory,
} from 'src/recipients/recipient'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { SendSelectRecipientSearchInput } from 'src/send/SendSelectRecipientSearchInput'
import useFetchRecipientVerificationStatus from 'src/send/useFetchRecipientVerificationStatus'
import colors from 'src/styles/colors'
import { typeScale, fontStyles } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { requestContactsPermission } from 'src/utils/permissions'
import PasteAddressButton from 'src/send/PasteAddressButton'
import { debounce } from 'lodash'
import { isAddressFormat } from 'src/account/utils'
import SendOrInviteButton from './SendOrInviteButton'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { isValidAddress } from '@celo/utils/lib/address'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { NameResolution, ResolutionKind } from '@valora/resolve-kit'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { StackParamList } from 'src/navigator/types'
import { SendOrigin } from 'src/analytics/types'
import InviteOptionsModal from 'src/components/InviteOptionsModal'

const SEARCH_THROTTLE_TIME = 100
const TYPING_DEBOUNCE_MILLSECONDS = 300

type Props = NativeStackScreenProps<StackParamList, Screens.SendSelectRecipient>

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
  ]

  return (
    <ScrollView
      contentContainerStyle={getStartedStyles.container}
      testID={'SelectRecipient/GetStarted'}
    >
      <View>
        <Text style={getStartedStyles.subtitle}>
          {t('sendSelectRecipient.getStarted.subtitle')}
        </Text>
        <Text style={getStartedStyles.title}>{t('sendSelectRecipient.getStarted.title')}</Text>
      </View>
      {options.map((params) => renderOption(params))}
    </ScrollView>
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

function SendSelectRecipient({ route }: Props) {
  const { t } = useTranslation()

  const forceTokenId = route.params?.forceTokenId
  const defaultTokenIdOverride = route.params?.defaultTokenIdOverride

  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const [sendOrInviteButtonHidden, setSendOrInviteButtonHidden] = useState(true)

  // We debounce the search query in order to perform network calls to check
  // if the query resolves to some special sort of identifier.
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery)
  const debounceSearchQuery = useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, TYPING_DEBOUNCE_MILLSECONDS),
    []
  )
  useEffect(() => {
    const parsedPhoneNumber = parsePhoneNumber(
      searchQuery,
      defaultCountryCode ? defaultCountryCode : undefined
    )

    if (parsedPhoneNumber) {
      debounceSearchQuery(parsedPhoneNumber.e164Number)
    } else {
      debounceSearchQuery(searchQuery)
    }
  }, [searchQuery, defaultCountryCode])
  const { result: resolveAddressResult } = useAsync(resolveId, [debouncedSearchQuery])

  const setSearchQueryWrapper = (query: string) => {
    // Always unset the selected recipient and hide the send/invite button
    // when the search query is changed in order to prevent edge cases
    // where the button appears but is bound to a recipient that is
    // not present on the page.
    unsetSelectedRecipient()
    setSendOrInviteButtonHidden(true)

    if (!query) {
      setShowSearchResults(false)
    } else {
      setShowSearchResults(true)
    }
    setSearchQuery(query)
  }

  const [showInviteModal, setShowInviteModal] = useState(false)

  const [showContacts, setShowContacts] = useState(false)

  const recentRecipients = useSelector((state) => state.send.recentRecipients)
  const contactsCache = useSelector(phoneRecipientCacheSelector)
  const recipientInfo = useSelector(recipientInfoSelector)

  const contactRecipients = useMemo(
    () => sortRecipients(Object.values(contactsCache)),
    [contactsCache]
  )
  const [contactsFiltered, setContactsFiltered] = useState(() =>
    sortRecipients(Object.values(contactRecipients))
  )
  const [recentFiltered, setRecentFiltered] = useState(() => recentRecipients)

  const recentRecipientsFilter = useMemo(
    () => filterRecipientFactory(recentRecipients, false),
    [recentRecipients]
  )
  const contactRecipientsFilter = useMemo(
    () => filterRecipientFactory(Object.values(contactRecipients), true),
    [contactRecipients]
  )

  const getUniqueSearchRecipient = (): Recipient | undefined => {
    const parsedNumber = parsePhoneNumber(
      searchQuery,
      defaultCountryCode ? defaultCountryCode : undefined
    )
    if (parsedNumber) {
      return {
        displayNumber: parsedNumber.displayNumber,
        e164PhoneNumber: parsedNumber.e164Number,
        recipientType: RecipientType.PhoneNumber,
        name: t('sendToMobileNumber'),
      }
    }
    if (isValidAddress(searchQuery)) {
      return getRecipientFromAddress(searchQuery.toLowerCase(), recipientInfo)
    }
  }

  const mapResolutionToRecipient = (resolution: NameResolution): Recipient => {
    const lowerCaseAddress = resolution.address.toLowerCase()
    switch (resolution.kind) {
      case ResolutionKind.Address:
        return getRecipientFromAddress(lowerCaseAddress, recipientInfo)
      case ResolutionKind.Nom:
        return {
          address: lowerCaseAddress,
          name: t('nomSpaceRecipient', { name: resolution.name ?? searchQuery }),
          recipientType: RecipientType.Nomspace,
        }
      default:
        return getRecipientFromAddress(lowerCaseAddress, recipientInfo)
    }
  }

  const mergedFilteredRecipients = useMemo(() => {
    const allRecipients: Recipient[] = []
    if (resolveAddressResult && resolveAddressResult.resolutions.length > 0) {
      const resolutions = resolveAddressResult.resolutions.map(mapResolutionToRecipient)
      allRecipients.push(...resolutions)
    }
    allRecipients.push(...recentFiltered)
    allRecipients.push(...contactsFiltered)

    const mergedRecipients: Recipient[] = []
    for (const potentialRecipient of allRecipients) {
      if (
        !mergedRecipients.find(
          (mergedRecipient) =>
            mergedRecipient.e164PhoneNumber === potentialRecipient.e164PhoneNumber ||
            mergedRecipient.address === potentialRecipient.address
        )
      ) {
        mergedRecipients.push(potentialRecipient)
      }
    }

    const uniqueRecipient = getUniqueSearchRecipient()
    if (!mergedRecipients.length && uniqueRecipient) {
      mergedRecipients.push(uniqueRecipient)
    }

    return mergedRecipients
  }, [recentFiltered, contactsFiltered, resolveAddressResult])

  const throttledSearch = throttle((searchInput: string) => {
    setSearchQueryWrapper(searchInput)
    setRecentFiltered(recentRecipientsFilter(searchInput))
    setContactsFiltered(contactRecipientsFilter(searchInput))
  }, SEARCH_THROTTLE_TIME)

  useEffect(() => {
    // Clear search when recipients change to avoid tricky states
    throttledSearch('')
  }, [recentRecipientsFilter, contactRecipientsFilter])

  const showGetStarted = !recentRecipients.length

  const { recipientVerificationStatus, recipient, setSelectedRecipient, unsetSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const setSelectedRecipientWrapper = (selectedRecipient: Recipient) => {
    setSelectedRecipient(selectedRecipient)
    setSendOrInviteButtonHidden(false)
  }
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

  const shouldShowClipboard = (content: string) => {
    return content !== searchQuery && isAddressFormat(content)
  }

  const sendOrInviteButtonDisabled =
    !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
  const shouldInviteRecipient =
    !sendOrInviteButtonDisabled &&
    recipient?.e164PhoneNumber &&
    recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED
  const sendOrInviteButtonText = shouldInviteRecipient ? t('invite') : t('send')
  const onPressSendOrInvite = () => {
    if (!recipient) {
      return
    }

    if (shouldInviteRecipient) {
      setShowInviteModal(true)
    } else {
      navigate(Screens.SendAmount, {
        isFromScan: false,
        defaultTokenIdOverride,
        forceTokenId,
        recipient,
        origin: SendOrigin.AppSendFlow,
      })
    }
  }

  const onCloseInviteModal = () => {
    setShowInviteModal(false)
  }

  const renderSearchResults = () => {
    if (mergedFilteredRecipients.length) {
      return (
        <>
          <Text style={styles.searchResultsHeader}>{t('sendSelectRecipient.results')}</Text>
          <RecipientPicker
            testID={'SelectRecipient/AllRecipientPicker'}
            recipients={mergedFilteredRecipients}
            onSelectRecipient={setSelectedRecipientWrapper}
            selectedRecipient={recipient}
            isSelectedRecipientLoading={
              !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
            }
          />
          <SendOrInviteButton
            onPress={onPressSendOrInvite}
            hidden={sendOrInviteButtonHidden}
            disabled={sendOrInviteButtonDisabled}
            text={sendOrInviteButtonText}
          />
        </>
      )
    } else {
      return (
        <>
          <View style={styles.noResultsWrapper}>
            <Text style={styles.noResultsTitle}>
              {t('noResultsFor')}
              <Text style={styles.noResultsTitle}>{` "${searchQuery}"`}</Text>
            </Text>
            <Text style={styles.noResultsSubtitle}>{t('searchForSomeone')}</Text>
          </View>
        </>
      )
    }
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
        <PasteAddressButton
          shouldShowClipboard={shouldShowClipboard}
          onChangeText={setSearchQueryWrapper}
          value={''}
        />
        {showSearchResults ? (
          renderSearchResults()
        ) : showContacts ? (
          <>
            <Text style={styles.title}>{t('sendSelectRecipient.contactsTitle')}</Text>
            <RecipientPicker
              testID={'SelectRecipient/ContactRecipientPicker'}
              recipients={contactRecipients}
              onSelectRecipient={setSelectedRecipientWrapper}
              selectedRecipient={recipient}
              isSelectedRecipientLoading={
                !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
              }
            />
            <SendOrInviteButton
              onPress={onPressSendOrInvite}
              hidden={sendOrInviteButtonHidden}
              disabled={sendOrInviteButtonDisabled}
              text={sendOrInviteButtonText}
            />
          </>
        ) : (
          <>
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
            {showGetStarted ? (
              <GetStartedSection />
            ) : (
              <RecipientPicker
                testID={'SelectRecipient/RecentRecipientPicker'}
                recipients={recentRecipients}
                title={t('sendSelectRecipient.recents')}
                onSelectRecipient={setSelectedRecipientWrapper}
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
      {showInviteModal && recipient && (
        <InviteOptionsModal recipient={recipient} onClose={onCloseInviteModal} />
      )}
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
    padding: Spacing.Thick24,
    paddingBottom: Spacing.Regular16,
    color: colors.dark,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
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
  searchResultsHeader: {
    ...typeScale.labelXSmall,
    color: colors.gray4,
    padding: Spacing.Thick24,
    paddingBottom: Spacing.Small12,
  },
  noResultsWrapper: {
    textAlign: 'center',
    marginTop: Spacing.Small12,
    padding: Spacing.Thick24,
  },
  noResultsTitle: {
    ...fontStyles.regular,
    color: colors.gray3,
    textAlign: 'center',
  },
  noResultsSubtitle: {
    ...typeScale.labelXSmall,
    color: colors.gray3,
    justifyContent: 'center',
    padding: Spacing.Thick24,
    textAlign: 'center',
  },
})

export default SendSelectRecipient
