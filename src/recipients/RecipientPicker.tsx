import { parsePhoneNumber } from '@celo/phone-utils'
import { isValidAddress } from '@celo/utils/lib/address'
import { NameResolution, ResolutionKind } from '@valora/resolve-kit'
import { debounce } from 'lodash'
import * as React from 'react'
import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import SectionHead from 'src/components/SectionHead'
import { RecipientVerificationStatus } from 'src/identity/types'
import RecipientItem from 'src/recipients/RecipientItem'
import {
  MobileRecipient,
  Recipient,
  RecipientType,
  getRecipientFromAddress,
  recipientHasContact,
  recipientHasNumber,
} from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import SendToAddressWarning from 'src/send/SendToAddressWarning'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

export interface Section {
  key: string
  data: Recipient[]
}

const TAG = 'recipients/RecipientPicker'

interface RecipientProps {
  testID?: string
  searchQuery: string
  sections: Section[]
  defaultCountryCode: string | null
  listHeaderComponent?: React.ComponentType<any>
  onSelectRecipient(recipient: Recipient): void
  selectedRecipient: Recipient | null
  recipientVerificationStatus: RecipientVerificationStatus
}

const TYPING_DEBOUNCE_MILLSECONDS = 300

export async function resolveId(id: string) {
  if (id === '') {
    return null
  }
  const resolveIdUrl = networkConfig.resolveId
  try {
    const response = await fetch(`${resolveIdUrl}?id=${encodeURIComponent(id)}`)
    if (response.ok) {
      return await response.json()
    }
    Logger.warn(TAG, `Unexpected result from resolving '${id}'`)
  } catch (error) {
    Logger.warn(TAG, `Error resolving '${id}'`, error)
  }
  return null
}

function RecipientPicker(props: RecipientProps) {
  const recipientInfo = useSelector(recipientInfoSelector)
  const showSendToAddressWarning = useSelector(
    (state: RootState) => state.send.showSendToAddressWarning
  )
  const { t } = useTranslation()

  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const [isSendToAddressWarningVisible, setSendToAddressWarningVisible] = useState(false)

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(props.searchQuery)

  const debounceSearchQuery = React.useCallback(
    debounce((query: string) => {
      setDebouncedSearchQuery(query)
    }, TYPING_DEBOUNCE_MILLSECONDS),
    []
  )
  React.useEffect(() => {
    const parsedPhoneNumber = parsePhoneNumber(
      props.searchQuery,
      props.defaultCountryCode ? props.defaultCountryCode : undefined
    )

    if (parsedPhoneNumber) {
      debounceSearchQuery(parsedPhoneNumber.e164Number)
    } else {
      debounceSearchQuery(props.searchQuery)
    }
  }, [props.searchQuery, props.defaultCountryCode])
  const { result: resolveAddressResult } = useAsync(resolveId, [debouncedSearchQuery])

  const onToggleKeyboard = (visible: boolean) => {
    setKeyboardVisible(visible)
  }

  const isFetchingVerificationStatus = (recipient: Recipient) => {
    return (
      !!props.selectedRecipient &&
      recipient.e164PhoneNumber === props.selectedRecipient.e164PhoneNumber &&
      props.recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN
    )
  }

  const renderItem = ({ item }: SectionListRenderItemInfo<Recipient, Section>) => {
    return (
      <RecipientItem
        recipient={item}
        onSelectRecipient={props.onSelectRecipient}
        loading={isFetchingVerificationStatus(item)}
      />
    )
  }

  const renderSectionHeader = (info: { section: SectionListData<Recipient, Section> }) => (
    <SectionHead text={info.section.key} />
  )

  const keyExtractor = (item: Recipient, index: number) => {
    if (recipientHasContact(item)) {
      return item.contactId + item.e164PhoneNumber + index
    } else if (recipientHasNumber(item)) {
      return item.e164PhoneNumber + index
    } else {
      return item.address + index
    }
  }

  const renderItemSeparator = () => <View style={styles.separator} />

  const renderEmptyView = () => {
    const parsedNumber = parsePhoneNumber(
      props.searchQuery,
      props.defaultCountryCode ? props.defaultCountryCode : undefined
    )
    if (parsedNumber) {
      return renderSendToPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
    }
    if (isValidAddress(props.searchQuery)) {
      return renderSendToAddress()
    }
    return renderNoContentEmptyView()
  }

  const renderNoContentEmptyView = () => (
    <View style={styles.emptyView}>
      {props.searchQuery !== '' ? (
        <>
          <View style={styles.emptyViewBody}>
            <Text style={fontStyles.emptyState}>
              {t('noResultsFor')}
              <Text style={fontStyles.emptyState}>{` "${props.searchQuery}"`}</Text>
            </Text>
            <Text style={styles.emptyStateBody}>{t('searchForSomeone')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyViewBody}>
          <Text style={fontStyles.emptyState}>{t('noContacts')}</Text>
        </View>
      )}
    </View>
  )

  const sendToUnknownAddress = (recipient: Recipient) => {
    setSendToAddressWarningVisible(true)
    ValoraAnalytics.track(SendEvents.check_account_alert_shown)
  }

  const onCancelWarning = () => {
    setSendToAddressWarningVisible(false)
    ValoraAnalytics.track(SendEvents.check_account_alert_back)
  }

  const renderSendToPhoneNumber = (displayNumber: string, e164PhoneNumber: string) => {
    const recipient: MobileRecipient = {
      displayNumber,
      e164PhoneNumber,
      recipientType: RecipientType.PhoneNumber,
    }
    return (
      <>
        <RecipientItem
          recipient={{ ...recipient, name: t('sendToMobileNumber') }}
          onSelectRecipient={() => props.onSelectRecipient(recipient)}
          loading={isFetchingVerificationStatus(recipient)}
        />
        {renderItemSeparator()}
      </>
    )
  }

  const renderSendToAddress = () => {
    const { searchQuery, onSelectRecipient } = props
    const searchedAddress = searchQuery.toLowerCase()
    const recipient = getRecipientFromAddress(searchedAddress, recipientInfo)

    if (recipientHasNumber(recipient)) {
      return (
        <>
          <RecipientItem
            recipient={recipient}
            onSelectRecipient={onSelectRecipient}
            loading={isFetchingVerificationStatus(recipient)}
          />
          {renderItemSeparator()}
        </>
      )
    } else {
      return (
        <>
          <RecipientItem
            recipient={recipient}
            onSelectRecipient={showSendToAddressWarning ? sendToUnknownAddress : onSelectRecipient}
            loading={isFetchingVerificationStatus(recipient)}
          />
          {renderItemSeparator()}
        </>
      )
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
          name: t('nomSpaceRecipient', { name: resolution.name ?? props.searchQuery }),
          recipientType: RecipientType.Nomspace,
        }
      default:
        return getRecipientFromAddress(lowerCaseAddress, recipientInfo)
    }
  }

  const buildSections = (defaultSections: Section[]) => {
    if (resolveAddressResult && resolveAddressResult.resolutions.length > 0) {
      return [
        ...defaultSections,
        { key: t('others'), data: resolveAddressResult.resolutions.map(mapResolutionToRecipient) },
      ]
    } else {
      return defaultSections
    }
  }

  return (
    <View style={styles.body} testID={props.testID}>
      {showSendToAddressWarning && (
        <SendToAddressWarning
          closeWarning={onCancelWarning}
          onSelectRecipient={props.onSelectRecipient}
          isVisible={isSendToAddressWarningVisible}
          recipient={{
            address: props.searchQuery.toLowerCase(),
            recipientType: RecipientType.Address,
          }}
        />
      )}
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <SectionList
            // Note: contentInsetAdjustmentBehavior="always" would be simpler
            // but leaves an incorrect top offset for the scroll bar after hiding the keyboard
            // so here we manually adjust the padding
            contentContainerStyle={
              !isKeyboardVisible &&
              insets && {
                paddingBottom: insets.bottom,
              }
            }
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            sections={buildSections(props.sections)}
            ItemSeparatorComponent={renderItemSeparator}
            ListHeaderComponent={props.listHeaderComponent}
            ListEmptyComponent={renderEmptyView()}
            keyExtractor={keyExtractor}
            initialNumToRender={30}
            keyboardShouldPersistTaps="always"
          />
        )}
      </SafeAreaInsetsContext.Consumer>
      <KeyboardSpacer onToggle={onToggleKeyboard} />
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  separator: {},
  emptyStateBody: {
    ...fontStyles.regular,
    color: colors.gray3,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyView: {
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  emptyViewBody: {
    justifyContent: 'center',
    paddingVertical: 24,
    textAlign: 'center',
  },
})

export default RecipientPicker
