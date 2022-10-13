import BottomSheet from '@gorhom/bottom-sheet'
import { TransitionPresets } from '@react-navigation/stack'
import { throttle } from 'lodash'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { numberVerifiedSelector } from 'src/app/selectors'
import { importContacts } from 'src/identity/actions'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { filterRecipientFactory, Recipient, sortRecipients } from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { InviteRewardsBanner } from 'src/send/InviteRewardsBanner'
import { inviteRewardsActiveSelector } from 'src/send/selectors'
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

type Props = {}

function Send(_props: Props) {
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

      ValoraAnalytics.track(SendEvents.send_select_recipient, {
        usedSearchBar: searchQuery.length > 0,
      })

      navigate(Screens.SendAmount, {
        recipient,
        isOutgoingPaymentRequest: false,
        origin: SendOrigin.AppSendFlow,
        forceTokenAddress: undefined,
      })
    },
    [searchQuery]
  )

  const onPressStartVerification = () => {
    navigate(Screens.VerificationEducationScreen, {
      hideOnboardingStep: true,
    })
  }

  const onPressContactsSettings = () => {
    navigateToPhoneSettings()
  }

  // @note When integrating phone numbers, revert commit 954520dfcac06626238702592bfe08a94ee64929
  const buildSections = (): Section[] => {
    const sections = [
      { key: t('recent'), data: [] },
      { key: t('contacts'), data: [] },
    ].filter((section) => section.data.length > 0)

    return sections
  }

  return (
    <BottomSheet index={0} snapPoints={['20%', '40%']}>
      <SendHeader isOutgoingPaymentRequest={false} />
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
        onSelectRecipient={onSelectRecipient}
        isOutgoingPaymentRequest={false}
      />
    </BottomSheet>
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
