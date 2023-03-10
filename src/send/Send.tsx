import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { throttle } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Keyboard, Platform, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import ContactPermission from 'src/icons/ContactPermission'
import VerifyPhone from 'src/icons/VerifyPhone'
import { importContacts } from 'src/identity/actions'
import { RecipientVerificationStatus } from 'src/identity/types'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { filterRecipientFactory, Recipient, sortRecipients } from 'src/recipients/recipient'
import RecipientPicker, { Section } from 'src/recipients/RecipientPicker'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { InviteRewardsBanner } from 'src/send/InviteRewardsBanner'
import { inviteRewardsActiveSelector } from 'src/send/selectors'
import { SendCallToAction } from 'src/send/SendCallToAction'
import SendHeader from 'src/send/SendHeader'
import { SendSearchInput } from 'src/send/SendSearchInput'
import useFetchRecipientVerificationStatus from 'src/send/useFetchRecipientVerificationStatus'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { requestContactsPermission } from 'src/utils/permissions'
import { stablecoinsSelector, tokensWithTokenBalanceSelector } from 'src/tokens/selectors'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'

const SEARCH_THROTTLE_TIME = 100

type Props = NativeStackScreenProps<StackParamList, Screens.Send>

function Send({ route }: Props) {
  const skipContactsImport = route.params?.skipContactsImport ?? false
  const isOutgoingPaymentRequest = route.params?.isOutgoingPaymentRequest ?? false
  const forceTokenAddress = route.params?.forceTokenAddress
  const defaultTokenOverride = route.params?.defaultTokenOverride
  const { t } = useTranslation()

  const { recipientVerificationStatus, recipient, setSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const numberVerified = useSelector(phoneNumberVerifiedSelector)
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)

  const allRecipients = useSelector(phoneRecipientCacheSelector)
  const recentRecipients = useSelector((state) => state.send.recentRecipients)

  const tokensWithBalance = useSelector(tokensWithTokenBalanceSelector)
  const stableTokens = useSelector(stablecoinsSelector)

  const [searchQuery, setSearchQuery] = useState('')
  const [hasGivenContactPermission, setHasGivenContactPermission] = useState(true)
  const [allFiltered, setAllFiltered] = useState(() => sortRecipients(Object.values(allRecipients)))
  const [recentFiltered, setRecentFiltered] = useState(() => recentRecipients)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showingCurrencyPicker, setShowCurrencyPicker] = useState(false)

  const closeCurrencyPicker = () => setShowCurrencyPicker(false)

  const dispatch = useDispatch()

  const recentRecipientsFilter = useMemo(
    () => filterRecipientFactory(recentRecipients, false),
    [recentRecipients]
  )

  const allRecipientsFilter = useMemo(
    () => filterRecipientFactory(Object.values(allRecipients), true),
    [allRecipients]
  )

  const throttledSearch = throttle((searchInput: string) => {
    setSearchQuery(searchInput)
    setRecentFiltered(recentRecipientsFilter(searchInput))
    setAllFiltered(allRecipientsFilter(searchInput))
  }, SEARCH_THROTTLE_TIME)

  useEffect(() => {
    // Clear search when recipients change to avoid tricky states
    throttledSearch('')
  }, [recentRecipientsFilter, allRecipientsFilter])

  const { result } = useAsync(async () => {
    if (allRecipients.length) {
      return
    }

    const permissionGranted = await requestContactsPermission()
    if (permissionGranted) {
      dispatch(importContacts())
    }

    return permissionGranted
  }, [])

  useEffect(() => {
    if (result === true || result === false) {
      setHasGivenContactPermission(result)
    }
  }, [result])

  useEffect(() => {
    if (!recipient || recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN) {
      return
    }

    // Dismiss the keyboard as soon as we know the verification status, so it does not
    // interfere with the invite modal or bottom sheet.
    Keyboard.dismiss()

    if (recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED) {
      setShowInviteModal(true)
      return
    }

    // Only show currency picker once we know that the recipient is verified,
    // and only if the user is permitted to change tokens.
    if (defaultTokenOverride) {
      navigate(Screens.SendAmount, {
        defaultTokenOverride,
        forceTokenAddress,
        recipient,
        isOutgoingPaymentRequest,
        origin: isOutgoingPaymentRequest ? SendOrigin.AppRequestFlow : SendOrigin.AppSendFlow,
      })
    } else {
      setShowCurrencyPicker(true)
    }
  }, [recipient, recipientVerificationStatus])

  const onSelectRecipient = useCallback(
    (recipient: Recipient) => {
      dispatch(hideAlert())

      ValoraAnalytics.track(
        isOutgoingPaymentRequest
          ? RequestEvents.request_select_recipient
          : SendEvents.send_select_recipient,
        {
          usedSearchBar: searchQuery.length > 0,
        }
      )
      setSelectedRecipient(recipient)
    },
    [isOutgoingPaymentRequest, searchQuery]
  )

  const onTokenSelected = (token: string) => {
    setShowCurrencyPicker(false)
    if (!recipient) {
      return
    }

    navigate(Screens.SendAmount, {
      defaultTokenOverride: token,
      recipient,
      isOutgoingPaymentRequest,
      origin: isOutgoingPaymentRequest ? SendOrigin.AppRequestFlow : SendOrigin.AppSendFlow,
    })
  }

  const onPressStartVerification = () => {
    navigate(Screens.VerificationStartScreen, {
      hideOnboardingStep: true,
    })
  }

  const onPressContactsSettings = () => {
    navigateToPhoneSettings()
  }

  const buildSections = (): Section[] => {
    const sections = [
      { key: t('recent'), data: recentFiltered },
      { key: t('contacts'), data: allFiltered },
    ].filter((section) => section.data.length > 0)

    return sections
  }

  const onCloseInviteModal = () => {
    setShowInviteModal(false)
  }

  const renderListHeader = () => {
    if (!numberVerified && !skipContactsImport) {
      return (
        <SendCallToAction
          icon={<VerifyPhone height={49} />}
          header={t('verificationCta.header')}
          body={t('verificationCta.body')}
          cta={t('verificationCta.cta')}
          onPressCta={onPressStartVerification}
        />
      )
    }
    if (numberVerified && !hasGivenContactPermission) {
      return (
        <SendCallToAction
          icon={<ContactPermission />}
          header={t('importContactsCta.header')}
          body={t('importContactsCta.body')}
          cta={t('importContactsCta.cta')}
          onPressCta={onPressContactsSettings}
        />
      )
    }
    return null
  }

  return (
    <SafeAreaView style={styles.body} edges={['top']}>
      <SendHeader isOutgoingPaymentRequest={isOutgoingPaymentRequest} />
      <DisconnectBanner />
      <SendSearchInput input={searchQuery} onChangeText={throttledSearch} />
      {inviteRewardsEnabled && hasGivenContactPermission && <InviteRewardsBanner />}
      <RecipientPicker
        testID={'RecipientPicker'}
        sections={buildSections()}
        searchQuery={searchQuery}
        defaultCountryCode={defaultCountryCode}
        listHeaderComponent={renderListHeader}
        onSelectRecipient={onSelectRecipient}
        isOutgoingPaymentRequest={isOutgoingPaymentRequest}
        selectedRecipient={recipient}
        recipientVerificationStatus={recipientVerificationStatus}
      />
      {showInviteModal && recipient && (
        <InviteOptionsModal recipient={recipient} onClose={onCloseInviteModal} />
      )}
      <TokenBottomSheet
        isVisible={showingCurrencyPicker}
        origin={TokenPickerOrigin.Send}
        onTokenSelected={onTokenSelected}
        onClose={closeCurrencyPicker}
        tokens={isOutgoingPaymentRequest ? stableTokens : tokensWithBalance}
      />
    </SafeAreaView>
  )
}

Send.navigationOptions = {
  ...noHeader,
  ...Platform.select({
    ios: { animation: 'slide_from_bottom' },
  }),
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
})

export default Send
