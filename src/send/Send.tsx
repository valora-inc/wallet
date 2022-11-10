import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { throttle } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import { RequestEvents, SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  centralPhoneVerificationEnabledSelector,
  inviteMethodSelector,
  phoneNumberVerifiedSelector,
  verificationPossibleSelector,
} from 'src/app/selectors'
import { InviteMethodType } from 'src/app/types'
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

const SEARCH_THROTTLE_TIME = 100

type Props = NativeStackScreenProps<StackParamList, Screens.Send>

function Send({ route }: Props) {
  const skipContactsImport = route.params?.skipContactsImport ?? false
  const isOutgoingPaymentRequest = route.params?.isOutgoingPaymentRequest ?? false
  const forceTokenAddress = route.params?.forceTokenAddress
  const { t } = useTranslation()

  const { recipientVerificationStatus, recipient, setSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const inviteMethod = useSelector(inviteMethodSelector)
  const centralPhoneVerificationEnabled = useSelector(centralPhoneVerificationEnabledSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const numberVerified = useSelector(phoneNumberVerifiedSelector)
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)

  const allRecipients = useSelector(phoneRecipientCacheSelector)
  const recentRecipients = useSelector((state) => state.send.recentRecipients)

  const [searchQuery, setSearchQuery] = useState('')
  const [hasGivenContactPermission, setHasGivenContactPermission] = useState(true)
  const [allFiltered, setAllFiltered] = useState(() => sortRecipients(Object.values(allRecipients)))
  const [recentFiltered, setRecentFiltered] = useState(() => recentRecipients)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const verificationPossible = useSelector(verificationPossibleSelector)

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

    const escrowDisabled =
      centralPhoneVerificationEnabled ||
      inviteMethod === InviteMethodType.ManualShare ||
      inviteMethod === InviteMethodType.ReferralUrl
    if (recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED && escrowDisabled) {
      setShowInviteModal(true)
      return
    }

    navigate(Screens.SendAmount, {
      recipient,
      isOutgoingPaymentRequest,
      origin: isOutgoingPaymentRequest ? SendOrigin.AppRequestFlow : SendOrigin.AppSendFlow,
      forceTokenAddress,
    })
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

  const onPressStartVerification = () => {
    navigate(Screens.VerificationEducationScreen, {
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
    if (!numberVerified && verificationPossible && !skipContactsImport) {
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
      {inviteRewardsEnabled && numberVerified && hasGivenContactPermission && (
        <InviteRewardsBanner />
      )}
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
    </SafeAreaView>
  )
}

Send.navigationOptions = {
  ...noHeader,
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
})

export default Send
