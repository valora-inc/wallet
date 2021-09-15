import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { showRequestDetails } from 'src/walletConnect/actions'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
import {
  acceptRequest as acceptRequestV1,
  denyRequest as denyRequestV1,
} from 'src/walletConnect/v1/actions'
import {
  acceptRequest as acceptRequestV2,
  denyRequest as denyRequestV2,
} from 'src/walletConnect/v2/actions'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectActionRequest>

function acceptRequest(params: Props['route']['params']) {
  switch (params.version) {
    case 1:
      return acceptRequestV1(params.peerId, params.action)
    case 2:
      return acceptRequestV2(params.action)
  }
}

function denyRequest(params: Props['route']['params']) {
  switch (params.version) {
    case 1:
      return denyRequestV1(params.peerId, params.action)
    case 2:
      return denyRequestV2(params.action)
  }
}

function getRequestInfo(params: Props['route']['params']) {
  switch (params.version) {
    case 1:
      return {
        url: params.dappUrl,
        name: params.dappName,
        icon: params.dappIcon,
        method: params.action.method,
        params: params.action.params,
      }
    case 2:
      return {
        url: params.dappUrl,
        name: params.dappName,
        icon: params.dappIcon,
        method: params.action.request.method,
        params: params.action.request.params,
      }
  }
}
function ActionRequest({ route: { params: routeParams } }: Props) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()

  const onAccept = () => {
    dispatch(acceptRequest(routeParams))
  }

  const onDeny = () => {
    dispatch(denyRequest(routeParams))
  }

  const { url, name, icon, method, params } = getRequestInfo(routeParams)
  const moreInfoString =
    method === SupportedActions.eth_signTransaction
      ? JSON.stringify(params)
      : method === SupportedActions.eth_signTypedData
      ? JSON.stringify(params[1])
      : method === SupportedActions.personal_decrypt
      ? Buffer.from(params[1]).toString('hex')
      : method === SupportedActions.personal_sign
      ? params[0]
      : null

  const onMoreInfo = () => {
    if (!moreInfoString) {
      return
    }

    dispatch(showRequestDetails(routeParams, moreInfoString))
  }

  const uri = icon ?? `${url}/favicon.ico`

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.center}>
          <Image style={styles.logo} source={{ uri }} />
        </View>
        <Text style={styles.header}>{t('connectToWallet', { dappName: name })}</Text>
        <Text style={styles.share}>{t('action.asking')}:</Text>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionHeaderText}>{t('action.operation')}</Text>
          <Text style={styles.bodyText}>
            {getTranslationFromAction(method as SupportedActions)}
          </Text>

          {moreInfoString && (
            <View>
              <Text style={styles.sectionHeaderText}>{t('action.data')}</Text>
              <TouchableOpacity onPress={onMoreInfo}>
                <Text style={[styles.bodyText, styles.underLine]}>{t('action.details')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            style={styles.button}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.MEDIUM}
            text={t('cancel')}
            onPress={onDeny}
            testID="WalletConnectActionCancel"
          />
          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={onAccept}
            testID="WalletConnectActionAllow"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function LeftHeader({ route: { params } }: Props) {
  const dispatch = useDispatch()

  const deny = () => {
    dispatch(denyRequest(params))
    navigateBack()
  }

  return <TopBarIconButton icon={<Times />} onPress={deny} />
}

ActionRequest.navigationOptions = (props: Props) => {
  return {
    ...emptyHeader,
    headerLeft: () => <LeftHeader {...props} />,
    headerLeftContainerStyle: { paddingLeft: 20 },
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    display: 'flex',
    alignItems: 'center',
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingVertical: 16,
  },
  logo: {
    height: 80,
    width: 80,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  sectionDivider: {
    alignItems: 'center',
    width: 200,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '15%',
  },
  buttonContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
  },
  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
})

export default ActionRequest
