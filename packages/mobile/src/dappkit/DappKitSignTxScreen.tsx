import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { DappKitEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ActiveDapp } from 'src/app/reducers'
import { activeDappSelector } from 'src/app/selectors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { getDefaultRequestTrackedProperties, requestTxSignature } from 'src/dappkit/dappkit'
import { withTranslation } from 'src/i18n'
import { noHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

const TAG = 'dappkit/DappKitSignTxScreen'

interface StateProps {
  activeDapp: ActiveDapp | null
}

interface DispatchProps {
  requestTxSignature: typeof requestTxSignature
}

type Props = StateProps &
  DispatchProps &
  WithTranslation &
  StackScreenProps<StackParamList, Screens.DappKitSignTxScreen>

const mapStateToProps = (state: RootState): StateProps => ({
  activeDapp: activeDappSelector(state),
})

const mapDispatchToProps = {
  requestTxSignature,
}

class DappKitSignTxScreen extends React.Component<Props> {
  static navigationOptions = noHeader

  componentDidMount() {
    const request = this.props.route.params.dappKitRequest

    if (!request) {
      Logger.error(TAG, 'No request found in navigation props')
      return
    }

    this.setState({ request })
  }

  getRequest = () => {
    return this.props.route.params.dappKitRequest
  }

  linkBack = () => {
    const request = this.getRequest()

    this.props.requestTxSignature(request)
  }

  showDetails = () => {
    const request = this.getRequest()

    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_details,
      getDefaultRequestTrackedProperties(request, this.props.activeDapp)
    )

    // TODO(sallyjyl): figure out which data to pass in for multitx
    navigate(Screens.DappKitTxDataScreen, {
      dappKitData: request.txs[0].txData,
    })
  }

  cancel = () => {
    ValoraAnalytics.track(
      DappKitEvents.dappkit_request_cancel,
      getDefaultRequestTrackedProperties(this.getRequest(), this.props.activeDapp)
    )
    navigateBack()
  }

  render() {
    const { t } = this.props
    const request = this.getRequest()
    const { dappName } = request

    return (
      <SafeAreaView style={styles.container}>
        <TopBarTextButton
          title={t('cancel')}
          onPress={this.cancel}
          titleStyle={styles.cancelButton}
        />

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {!!dappName && <Text style={styles.header}>{t('connectToWallet', { dappName })}</Text>}

          <Text style={styles.share}> {t('shareInfo')} </Text>

          <View style={styles.sectionDivider}>
            <Text style={styles.sectionHeaderText}>{t('transaction.operation')}</Text>
            <Text style={styles.bodyText}>{t('transaction.signTX')}</Text>
            <Text style={styles.sectionHeaderText}>{t('transaction.data')}</Text>
            <TouchableOpacity onPress={this.showDetails}>
              <Text style={[styles.bodyText, styles.underLine]}>{t('transaction.details')}</Text>
            </TouchableOpacity>
          </View>

          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={this.linkBack}
            testID="DappkitAllow"
          />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.Regular16,
  },
  header: {
    ...fontStyles.h1,
    alignItems: 'center',
    paddingBottom: 16,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  sectionDivider: {
    alignItems: 'center',
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
  },
  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    color: colors.dark,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>()(DappKitSignTxScreen))
