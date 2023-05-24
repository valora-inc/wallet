import React from 'react'
import { WithTranslation } from 'react-i18next'
import { View } from 'react-native'
import { connect } from 'react-redux'
import i18n, { withTranslation } from 'src/i18n'
import { HeaderTitleWithBalance } from 'src/navigator/Headers'
import { NotificationList } from 'src/notifications/NotificationList'
import IncomingPaymentRequestListItem from 'src/paymentRequest/IncomingPaymentRequestListItem'
import { getIncomingPaymentRequests } from 'src/paymentRequest/selectors'
import { PaymentRequest } from 'src/paymentRequest/types'
import { RootState } from 'src/redux/reducers'
import { Currency } from 'src/utils/currencies'

interface StateProps {
  paymentRequests: PaymentRequest[]
}

const mapStateToProps = (state: RootState): StateProps => ({
  paymentRequests: getIncomingPaymentRequests(state),
})

type Props = WithTranslation & StateProps

export const listItemRenderer =
  () =>
  (request: PaymentRequest, key: number | undefined = undefined) =>
    (
      <View key={key}>
        <IncomingPaymentRequestListItem paymentRequest={request} />
      </View>
    )

class IncomingPaymentRequestListScreen extends React.Component<Props> {
  static navigationOptions = () => ({
    headerTitle: (
      <HeaderTitleWithBalance title={i18n.t('incomingPaymentRequests')} token={Currency.Dollar} />
    ),
  })

  render = () => {
    return (
      <NotificationList items={this.props.paymentRequests} listItemRenderer={listItemRenderer()} />
    )
  }
}

export default connect<StateProps, {}, {}, RootState>(
  mapStateToProps,
  {}
)(withTranslation<Props>()(IncomingPaymentRequestListScreen))
