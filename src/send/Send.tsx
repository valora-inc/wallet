import { StackScreenProps, TransitionPresets } from '@react-navigation/stack'
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
import { numberVerifiedSelector, verificationPossibleSelector } from 'src/app/selectors'
import ContactPermission from 'src/icons/ContactPermission'
import VerifyPhone from 'src/icons/VerifyPhone'
import { importContacts } from 'src/identity/actions'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { filterRecipientFactory, Recipient, sortRecipients } from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { InviteRewardsBanner } from 'src/send/InviteRewardsBanner'
import { inviteRewardsActiveSelector } from 'src/send/selectors'
import { SendCallToAction } from 'src/send/SendCallToAction'
import SendHeader from 'src/send/SendHeader'
import { SendSearchInput } from 'src/send/SendSearchInput'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { requestContactsPermission } from 'src/utils/permissions'

const SEARCH_THROTTLE_TIME = 100

interface Section {
  key: string
  data: Recipient[]
}

type Props = StackScreenProps<StackParamList, Screens.Send>

function Send({ route }: Props) {
  const skipContactsImport = route.params?.skipContactsImport ?? false
  const isOutgoingPaymentRequest = route.params?.isOutgoingPaymentRequest ?? false
  const forceTokenAddress = route.params?.forceTokenAddress
  const { t } = useTranslation()

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const numberVerified = useSelector(numberVerifiedSelector)
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)

  const allRecipients = useSelector(phoneRecipientCacheSelector)
  const matchedContacts = useSelector((state) => state.identity.matchedContacts)
  const recentRecipients = useSelector((state) => state.send.recentRecipients)

  const [searchQuery, setSearchQuery] = useState('')
  const [hasGivenContactPermission, setHasGivenContactPermission] = useState(true)
  const [allFiltered, setAllFiltered] = useState(() =>
    sortRecipients(Object.values(allRecipients), matchedContacts)
  )
  const [recentFiltered, setRecentFiltered] = useState(() => recentRecipients)

  const verificationPossible = useSelector(verificationPossibleSelector)

  const dispatch = useDispatch()

  const recentRecipientsFilter = useMemo(() => filterRecipientFactory(recentRecipients, false), [
    recentRecipients,
  ])

  const allRecipientsFilter = useMemo(
    () => filterRecipientFactory(Object.values(allRecipients), true, matchedContacts),
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

      navigate(Screens.SendAmount, {
        recipient,
        isOutgoingPaymentRequest,
        origin: isOutgoingPaymentRequest ? SendOrigin.AppRequestFlow : SendOrigin.AppSendFlow,
        forceTokenAddress,
      })
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
      />
    </SafeAreaView>
  )
}

Send.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
})

export default Send
