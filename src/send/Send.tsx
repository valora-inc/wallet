import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { throttle } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Keyboard, Platform, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { defaultCountryCodeSelector } from 'src/account/selectors'
import { hideAlert } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendOrigin } from 'src/analytics/types'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import TokenBottomSheet, { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import ContactPermission from 'src/icons/ContactPermission'
import VerifyPhone from 'src/icons/VerifyPhone'
import { importContacts } from 'src/identity/actions'
import { RecipientVerificationStatus } from 'src/identity/types'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import RecipientPicker, { Section } from 'src/recipients/RecipientPicker'
import {
  Recipient,
  filterRecipientFactory,
  recipientHasAddress,
  sortRecipients,
} from 'src/recipients/recipient'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { InviteRewardsBanner } from 'src/send/InviteRewardsBanner'
import { SendCallToAction } from 'src/send/SendCallToAction'
import SendHeader from 'src/send/SendHeader'
import { SendSearchInput } from 'src/send/SendSearchInput'
import { inviteRewardsActiveSelector } from 'src/send/selectors'
import useFetchRecipientVerificationStatus from 'src/send/useFetchRecipientVerificationStatus'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { useTokensForSend } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import { sortFirstStableThenCeloThenOthersByUsdBalance } from 'src/tokens/utils'
import Logger from 'src/utils/Logger'
import { navigateToPhoneSettings } from 'src/utils/linking'
import { requestContactsPermission } from 'src/utils/permissions'

const SEARCH_THROTTLE_TIME = 100
const TAG = 'send/Send'

type Props = NativeStackScreenProps<StackParamList, Screens.Send>

function Send({ route }: Props) {
  const skipContactsImport = route.params?.skipContactsImport ?? false
  const forceTokenId = route.params?.forceTokenId
  const defaultTokenIdOverride = route.params?.defaultTokenIdOverride
  const { t } = useTranslation()

  const { recipientVerificationStatus, recipient, setSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const numberVerified = useSelector(phoneNumberVerifiedSelector)
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)

  const allRecipients = useSelector(phoneRecipientCacheSelector)
  const recentRecipients = useSelector((state) => state.send.recentRecipients)

  const tokensForSend = useTokensForSend()

  const [searchQuery, setSearchQuery] = useState('')
  const [hasGivenContactPermission, setHasGivenContactPermission] = useState(true)
  const [allFiltered, setAllFiltered] = useState(() => sortRecipients(Object.values(allRecipients)))
  const [recentFiltered, setRecentFiltered] = useState(() => recentRecipients)
  const [showInviteModal, setShowInviteModal] = useState(false)

  const currencyPickerBottomSheetRef = useRef<BottomSheetRefType>(null)
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

    if (getFeatureGate(StatsigFeatureGates.USE_NEW_SEND_FLOW)) {
      if (recipientHasAddress(recipient)) {
        navigate(Screens.SendEnterAmount, {
          isFromScan: false,
          defaultTokenIdOverride,
          forceTokenId,
          recipient,
          origin: SendOrigin.AppSendFlow,
        })
      } else {
        // TODO(cajubelt): get the recipient address before navigating to SendEnterAmount
        Logger.error(
          TAG,
          'Recipient does not have address field. Cannot continue with new send flow'
        )
      }
    } else if (defaultTokenIdOverride) {
      navigate(Screens.SendAmount, {
        isFromScan: false,
        defaultTokenIdOverride,
        forceTokenId,
        recipient,
        origin: SendOrigin.AppSendFlow,
      })
    } else {
      currencyPickerBottomSheetRef.current?.snapToIndex(0)
    }
  }, [recipient, recipientVerificationStatus])

  const onSelectRecipient = useCallback(
    (recipient: Recipient) => {
      dispatch(hideAlert())

      ValoraAnalytics.track(SendEvents.send_select_recipient, {
        usedSearchBar: searchQuery.length > 0,
        recipientType: recipient.recipientType,
      })
      setSelectedRecipient(recipient)
    },
    [searchQuery]
  )

  const onTokenSelected = ({ tokenId }: TokenBalance) => {
    currencyPickerBottomSheetRef.current?.close()

    if (!recipient) {
      return
    }

    navigate(Screens.SendAmount, {
      isFromScan: false,
      defaultTokenIdOverride: tokenId,
      recipient,
      origin: SendOrigin.AppSendFlow,
    })
  }

  const onPressStartVerification = () => {
    navigate(Screens.VerificationStartScreen)
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

  const sortedTokens = tokensForSend.sort(sortFirstStableThenCeloThenOthersByUsdBalance)

  return (
    <SafeAreaView style={styles.body} edges={['top']}>
      <SendHeader />
      <DisconnectBanner />
      <SendSearchInput input={searchQuery} onChangeText={throttledSearch} />
      {inviteRewardsActive && hasGivenContactPermission && <InviteRewardsBanner />}
      <RecipientPicker
        testID={'RecipientPicker'}
        sections={buildSections()}
        searchQuery={searchQuery}
        defaultCountryCode={defaultCountryCode}
        listHeaderComponent={renderListHeader}
        onSelectRecipient={onSelectRecipient}
        selectedRecipient={recipient}
        recipientVerificationStatus={recipientVerificationStatus}
      />
      {showInviteModal && recipient && (
        <InviteOptionsModal recipient={recipient} onClose={onCloseInviteModal} />
      )}
      <TokenBottomSheet
        forwardedRef={currencyPickerBottomSheetRef}
        origin={TokenPickerOrigin.Send}
        onTokenSelected={onTokenSelected}
        tokens={sortedTokens}
        title={t('selectToken')}
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
