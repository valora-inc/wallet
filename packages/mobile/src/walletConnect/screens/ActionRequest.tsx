import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
import {
  acceptRequest as acceptRequestV1,
  denyRequest as denyRequestV1,
  showRequestDetails as showRequestDetailsV1,
} from 'src/walletConnect/v1/actions'
import {
  acceptRequest as acceptRequestV2,
  denyRequest as denyRequestV2,
  showRequestDetails as showRequestDetailsV2,
} from 'src/walletConnect/v2/actions'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectActionRequest>

function showRequestDetails(params: Props['route']['params'], infoString: string) {
  switch (params.version) {
    case 1:
      return showRequestDetailsV1(params.peerId, params.action, infoString)
    case 2:
      return showRequestDetailsV2(params.action, infoString)
  }
}

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
function ActionRequest({ navigation, route: { params: routeParams } }: Props) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDenying, setIsDenying] = useState(false)
  const dispatch = useDispatch()

  const onAccept = () => {
    setIsAccepting(true)
    dispatch(acceptRequest(routeParams))
  }

  const onDeny = () => {
    setIsDenying(true)
    dispatch(denyRequest(routeParams))
  }

  const isLoading = isAccepting || isDenying

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (isLoading) {
          return
        }

        dispatch(denyRequest(routeParams))
      }),
    [navigation, routeParams, isLoading]
  )

  const { url, name, icon, method, params } = getRequestInfo(routeParams)
  const moreInfoString =
    method === SupportedActions.eth_signTransaction ||
    method === SupportedActions.eth_sendTransaction
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
