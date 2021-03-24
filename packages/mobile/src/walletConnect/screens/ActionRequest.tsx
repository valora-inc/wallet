import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { acceptRequest, denyRequest } from 'src/walletConnect/actions'
import { SupportedActions } from 'src/walletConnect/constants'
import { getSessions } from 'src/walletConnect/selectors'

const TAG = 'WalletConnect/RequestScreen'

const actionToTranslationString: { [x in SupportedActions]: string } = {
  [SupportedActions.eth_signTransaction]: 'action.signTransaction',
  [SupportedActions.personal_sign]: 'action.sign',
  [SupportedActions.eth_signTypedData]: 'action.sign',
  [SupportedActions.personal_decrypt]: 'action.decrypt',
  [SupportedActions.eth_accounts]: 'action.accounts',
}
function getTranslationFromAction(action: SupportedActions) {
  const translationString = actionToTranslationString[action]
  if (!translationString) {
    throw new Error('Unsupported action')
  }

  return translationString
}

type Props = StackScreenProps<StackParamList, Screens.WalletConnectActionRequest>
export default function WalletConnectRequestScreen({
  route: {
    params: { request },
  },
}: Props) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()
  const sessions = useSelector(getSessions)

  const onAccept = async () => {
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>
          {t('connectToWallet', { dappName: session?.peer.metadata.name })}
        </Text>

        <Text style={styles.share}> {t('action.asking')}</Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingBottom: 16,
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
  cancelButton: {
    color: colors.dark,
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
