import { Address, isValidAddress } from '@celo/utils/lib/address'
import { parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'
import {
  NameResolution,
  ResolutionKind,
  ResolveAddress,
  ResolveGroup,
  ResolveNom,
} from '@valora/resolve-kit'
import * as React from 'react'
import { useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import {
  ListRenderItemInfo,
  SectionList,
  SectionListData,
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
import { DEFAULT_FORNO_URL, DEFAULT_TESTNET } from 'src/config'
import {
  getRecipientFromAddress,
  MobileRecipient,
  Recipient,
  recipientHasContact,
  recipientHasNumber,
  RecipientType,
} from 'src/recipients/recipient'
import RecipientItem from 'src/recipients/RecipientItem'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import SendToAddressWarning from 'src/send/SendToAddressWarning'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Section {
  key: string
  data: Recipient[]
}

interface RecipientProps {
  testID?: string
  searchQuery: string
  sections: Section[]
  defaultCountryCode: string | null
  listHeaderComponent?: React.ComponentType<any>
  onSelectRecipient(recipient: Recipient): void
  isOutgoingPaymentRequest: boolean
}

const NOM_ADDRESSES: { [env: string]: Address } = {
  mainnet: ResolveNom.MainnetENSRegsitryAddress,
  alfajores: ResolveNom.AlfajoresENSRegsitryAddress,
}

function RecipientPicker(props: RecipientProps) {
  const recipientInfo = useSelector(recipientInfoSelector)
  const showSendToAddressWarning = useSelector(
    (state: RootState) => state.send.showSendToAddressWarning
  )
  const { t } = useTranslation()

  const [isKeyboardVisible, setKeyboardVisible] = useState(false)
  const [isSendToAddressWarningVisible, setSendToAddressWarningVisible] = useState(false)

  const { result: resolveAddressResult } = useAsync(async () => {
    const resolveGroup = new ResolveGroup([
      new ResolveAddress(),
      new ResolveNom({
        providerUrl: DEFAULT_FORNO_URL,
        ensRegistryAddress: NOM_ADDRESSES[DEFAULT_TESTNET],
      }),
    ])

    return await resolveGroup.resolve(props.searchQuery)
  }, [props.searchQuery])

  const onToggleKeyboard = (visible: boolean) => {
    setKeyboardVisible(visible)
  }

  const renderItem = ({ item, index }: ListRenderItemInfo<Recipient>) => (
    <RecipientItem recipient={item} onSelectRecipient={props.onSelectRecipient} />
  )

  const renderSectionHeader = (info: { section: SectionListData<Recipient> }) => (
    <SectionHead text={info.section.key as string} />
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
      return props.isOutgoingPaymentRequest
        ? renderRequestFromPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
        : renderSendToPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
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
      ) : null}
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

  const renderRequestFromPhoneNumber = (displayNumber: string, e164PhoneNumber: string) => {
    const recipient: MobileRecipient = {
      displayNumber,
      name: t('requestFromMobileNumber'),
      e164PhoneNumber,
    }
    return (
      <>
        <RecipientItem recipient={recipient} onSelectRecipient={props.onSelectRecipient} />
        {renderItemSeparator()}
      </>
    )
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
        />
        {renderItemSeparator()}
      </>
    )
  }

  const renderSendToAddress = () => {
    const { searchQuery, onSelectRecipient, isOutgoingPaymentRequest } = props
    const searchedAddress = searchQuery.toLowerCase()
    const recipient = getRecipientFromAddress(searchedAddress, recipientInfo)

    if (recipientHasNumber(recipient) || isOutgoingPaymentRequest) {
      return (
        <>
          <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
          {renderItemSeparator()}
        </>
      )
    } else {
      return (
        <>
          <RecipientItem
            recipient={recipient}
            onSelectRecipient={showSendToAddressWarning ? sendToUnknownAddress : onSelectRecipient}
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
          recipient={{ address: props.searchQuery.toLowerCase() }}
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
