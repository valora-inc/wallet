import { trimLeading0x } from '@celo/utils/lib/address'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import QuitIcon from 'src/icons/QuitIcon'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import { getTranslationFromAction, SupportedActions } from 'src/walletConnect/constants'
import { WalletConnectPayloadRequest, WalletConnectSession } from 'src/walletConnect/types'
import { acceptRequest, denyRequest, showRequestDetails } from 'src/walletConnect/v1/actions'
import { PendingAction } from 'src/walletConnect/v1/reducer'
import { selectSessionFromPeerId } from 'src/walletConnect/v1/selectors'
import ValoraDappIcon from 'src/walletConnect/ValoraDappIcon'

type Props = {
  navigation: StackNavigationProp<StackParamList, Screens.WalletConnectRequest>
  pendingAction: PendingAction
}

const DAPP_IMAGE_SIZE = 60

function getRequestInfo(pendingAction: WalletConnectPayloadRequest, session: WalletConnectSession) {
  return {
    url: session.peerMeta!.url,
    name: session.peerMeta!.name,
    icon: session.peerMeta!.icons[0],
    method: pendingAction.method,
    params: pendingAction.params,
  }
}
function ActionRequest({ navigation, pendingAction }: Props) {
  const { t } = useTranslation()
  const [isAccepting, setIsAccepting] = useStateWithCallback(false)
  const [isDenying, setIsDenying] = useStateWithCallback(false)
  const dispatch = useDispatch()

  const { action, peerId } = pendingAction
  const activeSession = useSelector(selectSessionFromPeerId(peerId))

  const isLoading = isAccepting || isDenying

  const onAccept = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsAccepting(true, () => dispatch(acceptRequest(peerId, action)))
  }

  const onDeny = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsDenying(true, () => dispatch(denyRequest(peerId, action, 'User denied')))
  }

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (isLoading) {
          return
        }
        e.preventDefault()
        onDeny()
      }),
    [navigation, onDeny, isLoading]
  )

  if (!activeSession) {
    // should never happen
    Logger.error(
      'WalletConnectRequest/ActionRequest',
      'No active WallectConnect session could be found'
    )
    return null
  }

  const { url, name, icon, method, params } = getRequestInfo(action, activeSession)
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
    // TODO: remove this as a separate screen
    dispatch(showRequestDetails(peerId, action, moreInfoString))
  }

  const uri = icon ?? `${url}/favicon.ico`

  return (
    <View style={styles.container}>
      <TopBarIconButton icon={<QuitIcon />} style={styles.closeButton} onPress={onDeny} />
      <View style={styles.logoContainer}>
        <ValoraDappIcon size={DAPP_IMAGE_SIZE} />
        <Image style={styles.logo} source={{ uri }} />
      </View>
      <Text style={styles.header}>
        {t('walletConnect.confirmTransaction.title', { dappName: name })}
      </Text>
      <Text style={styles.share}>
        {t('walletConnect.confirmTransaction.description', { dappName: name })}
      </Text>

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
          style={styles.buttonWithSpace}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
          text={t('cancel')}
          showLoading={isDenying}
          onPress={onDeny}
          testID="WalletConnectActionCancel"
        />
        <Button
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
          text={t('allow')}
          showLoading={isAccepting}
          onPress={onAccept}
          testID="WalletConnectActionAllow"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  logoContainer: {
    justifyContent: 'center',
    marginTop: Spacing.Thick24,
    flexDirection: 'row-reverse',
  },
  header: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingVertical: 16,
  },
  logo: {
    height: DAPP_IMAGE_SIZE,
    width: DAPP_IMAGE_SIZE,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginRight: -Spacing.Small12,
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
    marginBottom: 4,
  },
  buttonWithSpace: {
    marginRight: Spacing.Small12,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
    marginTop: 'auto',
  },
  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
})

export default ActionRequest
