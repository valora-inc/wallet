import VerifyPhone from '@celo/react-components/icons/VerifyPhone'
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
import { verificationPossibleSelector } from 'src/app/selectors'
import { estimateFee, FeeType } from 'src/fees/actions'
import { Namespaces } from 'src/i18n'
import ContactPermission from 'src/icons/ContactPermission'
import { importContacts } from 'src/identity/actions'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { filterRecipientFactory, Recipient, sortRecipients } from 'src/recipients/recipient'
import RecipientPicker from 'src/recipients/RecipientPicker'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { storeLatestInRecents } from 'src/send/actions'
import { InviteRewardsBanner } from 'src/send/InviteRewardsBanner'
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
  const isOutgoingPaymentRequest = route.params?.isOutgoingPaymentRequest ?? false
  const { t } = useTranslation(Namespaces.sendFlow7)

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const numberVerified = useSelector((state) => state.app.numberVerified)
  const inviteRewardsEnabled = useSelector((state) => state.send.inviteRewardsEnabled)

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

  useEffect(() => {
    // Trigger a fee estimation so it'll likely be finished and cached
    // when SendAmount screen is shown
    dispatch(estimateFee(FeeType.SEND))
  }, [])

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
    dispatch(importContacts())
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

      dispatch(storeLatestInRecents(recipient))

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
        origin: SendOrigin.AppSendFlow,
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
    if (!numberVerified && verificationPossible) {
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
    if (numberVerified && hasGivenContactPermission && inviteRewardsEnabled) {
      return <InviteRewardsBanner />
    }
    return null
  }

  return (
    <SafeAreaView style={styles.body} edges={['top']}>
      <SendHeader isOutgoingPaymentRequest={isOutgoingPaymentRequest} />
      <DisconnectBanner />
      <SendSearchInput input={searchQuery} onChangeText={throttledSearch} />
      <RecipientPicker
        testID={'RecipientPicker'}
        sections={buildSections()}
        searchQuery={searchQuery}
        defaultCountryCode={defaultCountryCode}
        listHeaderComponent={renderListHeader}
        onSelectRecipient={onSelectRecipient}
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
