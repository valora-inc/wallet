import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { getFontScaleSync } from 'react-native-device-info'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isAddressFormat } from 'src/account/utils'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { SendOrigin } from 'src/analytics/types'
import Button, { BtnSizes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import InviteOptionsModal from 'src/components/InviteOptionsModal'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import CircledIcon from 'src/icons/CircledIcon'
import Times from 'src/icons/Times'
import { importContacts } from 'src/identity/actions'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { AddressValidationType } from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import {
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import RecipientPicker from 'src/recipients/RecipientPickerV2'
import { Recipient, RecipientType, recipientHasNumber } from 'src/recipients/recipient'
import { useDispatch, useSelector } from 'src/redux/hooks'
import InviteRewardsCard from 'src/send/InviteRewardsCard'
import PasteAddressButton from 'src/send/PasteAddressButton'
import SelectRecipientButtons from 'src/send/SelectRecipientButtons'
import { SendSelectRecipientSearchInput } from 'src/send/SendSelectRecipientSearchInput'
import { useMergedSearchRecipients, useSendRecipients } from 'src/send/hooks'
import { inviteRewardsActiveSelector } from 'src/send/selectors'
import useFetchRecipientVerificationStatus from 'src/send/useFetchRecipientVerificationStatus'
import colors from 'src/styles/colors'
import { fontStyles, typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

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
        <CircledIcon
          radius={Math.min(24 * getFontScaleSync(), 50)}
          style={getStartedStyles.optionNum}
          backgroundColor={colors.white}
        >
          <Text adjustsFontSizeToFit={true} style={getStartedStyles.optionNumText}>
            {optionNum}
          </Text>
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
    color: colors.black,
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

function SendOrInviteButton({
  recipient,
  recipientVerificationStatus,
  onPress,
}: {
  recipient: Recipient | null
  recipientVerificationStatus: RecipientVerificationStatus
  onPress: (shouldInviteRecipient: boolean) => void
}) {
  const { t } = useTranslation()
  const sendOrInviteButtonDisabled =
    !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
  const shouldInviteRecipient =
    !sendOrInviteButtonDisabled &&
    recipient?.recipientType === RecipientType.PhoneNumber &&
    recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED
  return (
    <Button
      testID="SendOrInviteButton"
      style={styles.sendOrInviteButton}
      onPress={() => onPress(shouldInviteRecipient)}
      disabled={sendOrInviteButtonDisabled}
      text={
        shouldInviteRecipient
          ? t('sendSelectRecipient.buttons.invite')
          : t('sendSelectRecipient.buttons.send')
      }
      size={BtnSizes.FULL}
    />
  )
}
enum SelectRecipientView {
  Recent = 'Recent',
  Contacts = 'Contacts',
}

function SendSelectRecipient({ route }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const inviteRewardsActive = useSelector(inviteRewardsActiveSelector)
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)

  const forceTokenId = route.params?.forceTokenId
  const defaultTokenIdOverride = route.params?.defaultTokenIdOverride

  const [showSendOrInviteButton, setShowSendOrInviteButton] = useState(false)

  const [showSearchResults, setShowSearchResults] = useState(false)

  const [activeView, setActiveView] = useState(SelectRecipientView.Recent)

  const [showInviteModal, setShowInviteModal] = useState(false)

  const onSearch = (searchQuery: string) => {
    // Always unset the selected recipient and hide the send/invite button
    // when the search query is changed in order to prevent edge cases
    // where the button appears but is bound to a recipient that is
    // not present on the page.
    unsetSelectedRecipient()
    setShowSendOrInviteButton(false)
    setShowSearchResults(!!searchQuery)
  }
  const { contactRecipients, recentRecipients } = useSendRecipients()
  const { mergedRecipients, searchQuery, setSearchQuery } = useMergedSearchRecipients(onSearch)

  const { recipientVerificationStatus, recipient, setSelectedRecipient, unsetSelectedRecipient } =
    useFetchRecipientVerificationStatus()

  const showUnknownAddressInfo =
    showSendOrInviteButton &&
    showSearchResults &&
    recipient &&
    recipient.recipientType !== RecipientType.PhoneNumber &&
    recipientVerificationStatus === RecipientVerificationStatus.UNVERIFIED

  const setSelectedRecipientWrapper = (selectedRecipient: Recipient) => {
    setSelectedRecipient(selectedRecipient)
    setShowSendOrInviteButton(true)
  }

  const onContactsPermissionGranted = () => {
    dispatch(importContacts())
    setActiveView(SelectRecipientView.Contacts)
  }

  const shouldShowClipboard = (content: string) => {
    return content !== searchQuery && isAddressFormat(content)
  }

  const onSelectRecentRecipient = (recentRecipient: Recipient) => {
    ValoraAnalytics.track(SendEvents.send_select_recipient_recent_press, {
      recipientType: recentRecipient.recipientType,
    })
    setSelectedRecipient(recentRecipient)
    nextScreen(recentRecipient)
  }

  const nextScreen = (selectedRecipient: Recipient) => {
    // use the address from the recipient object
    let address: string | null | undefined = selectedRecipient.address

    // if not present there must be a phone number, route through secure send or get
    // the secure send mapped address
    if (!address && recipientHasNumber(selectedRecipient)) {
      const addressValidationType: AddressValidationType = getAddressValidationType(
        selectedRecipient,
        secureSendPhoneNumberMapping
      )
      if (addressValidationType !== AddressValidationType.NONE) {
        navigate(Screens.ValidateRecipientIntro, {
          defaultTokenIdOverride,
          forceTokenId,
          recipient: selectedRecipient,
          origin: SendOrigin.AppSendFlow,
        })
        return
      }
      address = getAddressFromPhoneNumber(
        selectedRecipient.e164PhoneNumber,
        e164NumberToAddress,
        secureSendPhoneNumberMapping,
        undefined
      )
    }

    if (!address) {
      // this should never happen
      throw new Error(
        'No address found, this should never happen. Should have routed to invite or secure send.'
      )
    }

    navigate(Screens.SendEnterAmount, {
      isFromScan: false,
      defaultTokenIdOverride,
      forceTokenId,
      recipient: {
        ...selectedRecipient,
        address,
      },
      origin: SendOrigin.AppSendFlow,
    })
  }

  const onPressSendOrInvite = (shouldInviteRecipient: boolean) => {
    if (!recipient) {
      return
    }
    if (shouldInviteRecipient) {
      ValoraAnalytics.track(SendEvents.send_select_recipient_invite_press, {
        recipientType: recipient.recipientType,
      })
      setShowSendOrInviteButton(false)
      setShowInviteModal(true)
    } else {
      ValoraAnalytics.track(SendEvents.send_select_recipient_send_press, {
        recipientType: recipient.recipientType,
      })
      nextScreen(recipient)
    }
  }

  const onCloseInviteModal = () => {
    setShowInviteModal(false)
  }

  const renderSearchResults = () => {
    if (mergedRecipients.length) {
      return (
        <>
          <Text style={styles.searchResultsHeader}>{t('sendSelectRecipient.results')}</Text>
          <RecipientPicker
            testID={'SelectRecipient/AllRecipientsPicker'}
            recipients={mergedRecipients}
            onSelectRecipient={setSelectedRecipientWrapper}
            selectedRecipient={recipient}
            isSelectedRecipientLoading={
              !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
            }
          />
        </>
      )
    } else {
      return (
        <View testID={'SelectRecipient/NoResults'} style={styles.noResultsWrapper}>
          <Text style={styles.noResultsTitle}>
            {t('noResultsFor')}
            <Text style={styles.noResultsTitle}>{` "${searchQuery}"`}</Text>
          </Text>
          <Text style={styles.noResultsSubtitle}>{t('searchForSomeone')}</Text>
        </View>
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
        <SendSelectRecipientSearchInput input={searchQuery} onChangeText={setSearchQuery} />
      </View>
      <KeyboardAwareScrollView keyboardDismissMode="on-drag">
        <PasteAddressButton
          shouldShowClipboard={shouldShowClipboard}
          onChangeText={setSearchQuery}
          value={''}
        />
        {showSearchResults ? (
          renderSearchResults()
        ) : activeView === SelectRecipientView.Contacts ? (
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
          </>
        ) : (
          <>
            <Text style={styles.title}>{t('sendSelectRecipient.title')}</Text>
            {inviteRewardsActive && <InviteRewardsCard />}
            <SelectRecipientButtons onContactsPermissionGranted={onContactsPermissionGranted} />
            {activeView === SelectRecipientView.Recent && recentRecipients.length ? (
              <RecipientPicker
                testID={'SelectRecipient/RecentRecipientPicker'}
                recipients={recentRecipients}
                title={t('sendSelectRecipient.recents')}
                onSelectRecipient={onSelectRecentRecipient}
                selectedRecipient={recipient}
                isSelectedRecipientLoading={
                  !!recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
                }
                style={styles.recentRecipientPicker}
              />
            ) : (
              <GetStartedSection />
            )}
          </>
        )}
      </KeyboardAwareScrollView>
      {showInviteModal && recipient && (
        <InviteOptionsModal recipient={recipient} onClose={onCloseInviteModal} />
      )}
      {showUnknownAddressInfo && (
        <InLineNotification
          variant={NotificationVariant.Info}
          description={t('sendSelectRecipient.unknownAddressInfo')}
          testID="UnknownAddressInfo"
          style={styles.unknownAddressInfo}
        />
      )}
      {showSendOrInviteButton && (
        <SendOrInviteButton
          recipient={recipient}
          recipientVerificationStatus={recipientVerificationStatus}
          onPress={onPressSendOrInvite}
        />
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
    color: colors.black,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 10,
  },
  body: {
    flex: 1,
    paddingBottom: variables.contentPadding,
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
  unknownAddressInfo: {
    margin: Spacing.Thick24,
    marginBottom: variables.contentPadding,
  },
  sendOrInviteButton: {
    margin: Spacing.Thick24,
    marginTop: variables.contentPadding,
  },
})

export default SendSelectRecipient
