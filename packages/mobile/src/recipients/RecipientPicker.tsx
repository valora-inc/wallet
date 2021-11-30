import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import SectionHead from '@celo/react-components/components/SectionHead'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { isValidAddress } from '@celo/utils/lib/address'
import { parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  ListRenderItemInfo,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { withTranslation } from 'src/i18n'
import {
  getRecipientFromAddress,
  MobileRecipient,
  Recipient,
  recipientHasContact,
  recipientHasNumber,
  RecipientInfo,
} from 'src/recipients/recipient'
import RecipientItem from 'src/recipients/RecipientItem'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import SendToAddressWarning from 'src/send/SendToAddressWarning'

interface Section {
  key: string
  data: Recipient[]
}

interface Props {
  testID?: string
  searchQuery: string
  sections: Section[]
  defaultCountryCode: string | null
  listHeaderComponent?: React.ComponentType<any>
  onSelectRecipient(recipient: Recipient): void
  isOutgoingPaymentRequest: boolean
}

interface StateProps {
  recipientInfo: RecipientInfo
  showSendToAddressWarning: boolean
}

type RecipientProps = Props & WithTranslation & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  recipientInfo: recipientInfoSelector(state),
  showSendToAddressWarning: state.send.showSendToAddressWarning,
})

export class RecipientPicker extends React.Component<RecipientProps> {
  state = {
    keyboardVisible: false,
    isSendToAddressWarningVisible: false,
  }

  onToggleKeyboard = (visible: boolean) => {
    this.setState({ keyboardVisible: visible })
  }

  renderItem = ({ item, index }: ListRenderItemInfo<Recipient>) => (
    <RecipientItem recipient={item} onSelectRecipient={this.props.onSelectRecipient} />
  )

  renderSectionHeader = (info: { section: SectionListData<Recipient> }) => (
    <SectionHead text={info.section.key as string} />
  )

  keyExtractor = (item: Recipient, index: number) => {
    if (recipientHasContact(item)) {
      return item.contactId + item.e164PhoneNumber + index
    } else if (recipientHasNumber(item)) {
      return item.e164PhoneNumber + index
    } else {
      return item.address + index
    }
  }

  renderItemSeparator = () => <View style={styles.separator} />

  renderEmptyView = () => {
    const parsedNumber = parsePhoneNumber(
      this.props.searchQuery,
      this.props.defaultCountryCode ? this.props.defaultCountryCode : undefined
    )
    if (parsedNumber) {
      return this.props.isOutgoingPaymentRequest
        ? this.renderRequestFromPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
        : this.renderSendToPhoneNumber(parsedNumber.displayNumber, parsedNumber.e164Number)
    }
    if (isValidAddress(this.props.searchQuery)) {
      return this.renderSendToAddress()
    }
    return this.renderNoContentEmptyView()
  }

  renderNoContentEmptyView = () => (
    <View style={styles.emptyView}>
      {this.props.searchQuery !== '' ? (
        <>
          <View style={styles.emptyViewBody}>
            <Text style={fontStyles.emptyState}>
              {this.props.t('noResultsFor')}
              <Text style={fontStyles.emptyState}>{` "${this.props.searchQuery}"`}</Text>
            </Text>
            <Text style={styles.emptyStateBody}>{this.props.t('searchForSomeone')}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyViewBody}>
          <Text style={fontStyles.emptyState}>{this.props.t('noContacts')}</Text>
        </View>
      )}
    </View>
  )

  sendToUnknownAddress = (recipient: Recipient) => {
    this.setState({ isSendToAddressWarningVisible: true })
    ValoraAnalytics.track(SendEvents.check_account_alert_shown)
  }

  onCancelWarning = () => {
    this.setState({ isSendToAddressWarningVisible: false })
    ValoraAnalytics.track(SendEvents.check_account_alert_back)
  }

  renderRequestFromPhoneNumber = (displayNumber: string, e164PhoneNumber: string) => {
    const { onSelectRecipient, t } = this.props
    const recipient: MobileRecipient = {
      displayNumber,
      name: t('requestFromMobileNumber'),
      e164PhoneNumber,
    }
    return (
      <>
        <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
        {this.renderItemSeparator()}
      </>
    )
  }

  renderSendToPhoneNumber = (displayNumber: string, e164PhoneNumber: string) => {
    const { onSelectRecipient, t } = this.props
    const recipient: MobileRecipient = {
      displayNumber,
      e164PhoneNumber,
    }
    return (
      <>
        <RecipientItem
          recipient={{ ...recipient, name: t('sendToMobileNumber') }}
          onSelectRecipient={() => onSelectRecipient(recipient)}
        />
        {this.renderItemSeparator()}
      </>
    )
  }

  renderSendToAddress = () => {
    const { searchQuery, recipientInfo, onSelectRecipient, showSendToAddressWarning } = this.props
    const searchedAddress = searchQuery.toLowerCase()
    const recipient = getRecipientFromAddress(searchedAddress, recipientInfo)

    if (recipientHasNumber(recipient)) {
      return (
        <>
          <RecipientItem recipient={recipient} onSelectRecipient={onSelectRecipient} />
          {this.renderItemSeparator()}
        </>
      )
    } else {
      return (
        <>
          <RecipientItem
            recipient={recipient}
            onSelectRecipient={
              showSendToAddressWarning ? this.sendToUnknownAddress : onSelectRecipient
            }
          />
          {this.renderItemSeparator()}
        </>
      )
    }
  }

  render() {
    const {
      sections,
      listHeaderComponent,
      showSendToAddressWarning,
      onSelectRecipient,
      searchQuery,
    } = this.props

    return (
      <View style={styles.body} testID={this.props.testID}>
        {showSendToAddressWarning && (
          <SendToAddressWarning
            closeWarning={this.onCancelWarning}
            onSelectRecipient={onSelectRecipient}
            isVisible={this.state.isSendToAddressWarningVisible}
            recipient={{ address: searchQuery.toLowerCase() }}
          />
        )}
        <SafeAreaInsetsContext.Consumer>
          {(insets) => (
            <SectionList
              // Note: contentInsetAdjustmentBehavior="always" would be simpler
              // but leaves an incorrect top offset for the scroll bar after hiding the keyboard
              // so here we manually adjust the padding
              contentContainerStyle={
                !this.state.keyboardVisible &&
                insets && {
                  paddingBottom: insets.bottom,
                }
              }
              renderItem={this.renderItem}
              renderSectionHeader={this.renderSectionHeader}
              sections={sections}
              ItemSeparatorComponent={this.renderItemSeparator}
              ListHeaderComponent={listHeaderComponent}
              ListEmptyComponent={this.renderEmptyView()}
              keyExtractor={this.keyExtractor}
              initialNumToRender={30}
              keyboardShouldPersistTaps="always"
            />
          )}
        </SafeAreaInsetsContext.Consumer>
        <KeyboardSpacer onToggle={this.onToggleKeyboard} />
      </View>
    )
  }
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

export default connect(mapStateToProps, {})(withTranslation<RecipientProps>()(RecipientPicker))
