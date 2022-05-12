import { trimLeading0x } from '@celo/utils/lib/address'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
import {
  acceptRequest as acceptRequestV1,
  denyRequest as denyRequestV1,
  showRequestDetails as showRequestDetailsV1,
} from 'src/walletConnect/v1/actions'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectActionRequest>

function showRequestDetails(params: Props['route']['params'], infoString: string) {
  return showRequestDetailsV1(params.peerId, params.action, infoString)
}

function acceptRequest(params: Props['route']['params']) {
  return acceptRequestV1(params.peerId, params.action)
}

function denyRequest(params: Props['route']['params']) {
  return denyRequestV1(params.peerId, params.action, 'User denied')
}

function getRequestInfo(params: Props['route']['params']) {
  return {
    url: params.dappUrl,
    name: params.dappName,
    icon: params.dappIcon,
    method: params.action.method,
    params: params.action.params,
  }
}
function ActionRequest({ navigation, route: { params: routeParams } }: Props) {
  const { t } = useTranslation()
  const [isAccepting, setIsAccepting] = useStateWithCallback(false)
  const [isDenying, setIsDenying] = useStateWithCallback(false)
  const dispatch = useDispatch()

  const onAccept = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsAccepting(true, () => dispatch(acceptRequest(routeParams)))
  }

  const onDeny = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsDenying(true, () => dispatch(denyRequest(routeParams)))
  }

  const isLoading = isAccepting || isDenying

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (isLoading) {
          return
        }
        e.preventDefault()
        onDeny()
      }),
    [navigation, routeParams, isLoading]
  )

  const { url, name, icon, method, params } = getRequestInfo(routeParams)
  const moreInfoString =
    method === SupportedActions.eth_signTransaction ||
    method === SupportedActions.eth_sendTransaction
      ? JSON.stringify(params)
      : method === SupportedActions.eth_signTypedData ||
        method === SupportedActions.eth_signTypedData_v4
      ? JSON.stringify(params[1])
      : method === SupportedActions.personal_decrypt
      ? Buffer.from(params[1]).toString('hex')
      : method === SupportedActions.personal_sign
      ? Buffer.from(trimLeading0x(params[0]), 'hex').toString() ||
        params[0] ||
        t('action.emptyMessage')
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
            {getTranslationFromAction(t, method as SupportedActions)}
          </Text>

          {moreInfoString && (
            <>
              <Text style={styles.sectionHeaderText}>{t('action.data')}</Text>
              <TouchableOpacity onPress={onMoreInfo}>
                <Text style={[styles.bodyText, styles.underLine]}>{t('action.details')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.buttonContainer} pointerEvents={isLoading ? 'none' : undefined}>
          <Button
            style={styles.button}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.MEDIUM}
            text={t('cancel')}
            showLoading={isDenying}
            onPress={onDeny}
            testID="WalletConnectActionCancel"
          />
          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            showLoading={isAccepting}
            onPress={onAccept}
            testID="WalletConnectActionAllow"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

ActionRequest.navigationOptions = headerWithCloseButton

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
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
