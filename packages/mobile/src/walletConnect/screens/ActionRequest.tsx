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
import { useDispatch, useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { acceptRequest, denyRequest } from 'src/walletConnect/actions'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
import { selectPendingActions, selectSessions } from 'src/walletConnect/selectors'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectActionRequest>
function WalletConnectRequestScreen({
  route: {
    params: { request },
  },
}: Props) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()
  const { sessions } = useSelector(selectSessions)

  const onAccept = () => {
    dispatch(acceptRequest(request))
  }

  const onDeny = () => {
    dispatch(denyRequest(request))
  }

  const {
    request: { method, params },
  } = request
  const moreInfoString =
    method === SupportedActions.eth_signTransaction
      ? JSON.stringify(params)
      : method === SupportedActions.eth_signTypedData
      ? JSON.stringify(params[1])
      : method === SupportedActions.personal_decrypt
      ? params[1]
      : method === SupportedActions.personal_sign
      ? params[0]
      : null

  const onMoreInfo = () => {
    if (!moreInfoString) {
      return
    }

    // todo: this is a short lived alternative to proper
    // transaction decoding.
    navigate(Screens.DappKitTxDataScreen, {
      dappKitData: moreInfoString,
    })
  }

  const session = sessions.find((s) => s.topic === request.topic)
  const icon = session?.peer.metadata.icons[0] ?? `${session?.peer.metadata.url}/favicon.ico`
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={{ display: 'flex', alignItems: 'center' }}>
          <Image style={{ height: 80, width: 80 }} source={{ uri: icon }} height={80} width={80} />
        </View>
        <Text style={styles.header}>
          {t('connectToWallet', { dappName: session?.peer.metadata.name })}
        </Text>

        <Text style={styles.share}> {t('action.asking')}:</Text>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionHeaderText}>{t('action.operation')}</Text>
          <Text style={styles.bodyText}>
            {t(getTranslationFromAction(method as SupportedActions))}
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

function LeftHeader() {
  const dispatch = useDispatch()
  const [action] = useSelector(selectPendingActions)

  const deny = () => {
    dispatch(denyRequest(action))
    navigateBack()
  }

  return <TopBarIconButton icon={<Times />} onPress={deny} />
}

WalletConnectRequestScreen.navigationOptions = () => {
  return {
    ...emptyHeader,
    headerLeft: LeftHeader,
    headerLeftContainerStyle: { paddingLeft: 20 },
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingVertical: 16,
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

export default WalletConnectRequestScreen
