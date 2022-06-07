import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useDispatch } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import QuitIcon from 'src/icons/QuitIcon'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import { WalletConnectSessionRequest } from 'src/walletConnect/types'
import { acceptSession, denySession } from 'src/walletConnect/v1/actions'

type Props = {
  navigation: StackNavigationProp<StackParamList, Screens.WalletConnectRequest>
  pendingSession: WalletConnectSessionRequest
}

function SessionRequest({ navigation, pendingSession }: Props) {
  const { t } = useTranslation()
  const [isAccepting, setIsAccepting] = useStateWithCallback(false)
  const [isDenying, setIsDenying] = useStateWithCallback(false)
  const dispatch = useDispatch()

  const confirm = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsAccepting(true, () => dispatch(acceptSession(pendingSession)))
  }

  const deny = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsDenying(true, () => dispatch(denySession(pendingSession)))
  }

  const isLoading = isAccepting || isDenying

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (isLoading) {
          return
        }
        e.preventDefault()
        deny()
      }),
    [navigation, pendingSession, isLoading]
  )

  const { url, name, icons } = pendingSession.params[0].peerMeta
  const fallbackIcon = icons[0] ?? `${url}/favicon.ico`

  return (
    <>
      <TopBarIconButton icon={<QuitIcon />} style={styles.closeButton} onPress={deny} />
      <View>
        <View style={styles.center}>
          <Image style={styles.logo} source={{ uri: fallbackIcon }} />
        </View>
        <Text style={styles.header} testID="SessionRequestHeader">
          {t('connectToWallet', { dappName: name })}
        </Text>
      </View>

      <View style={styles.actionContainer} pointerEvents={isLoading ? 'none' : undefined}>
        <Button
          style={styles.cancelButton}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
          text={t('cancel')}
          showLoading={isDenying}
          onPress={deny}
        />
        <Button
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
          text={t('allow')}
          showLoading={isAccepting}
          onPress={confirm}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  logo: {
    height: 80,
    width: 80,
  },
  center: { display: 'flex', alignItems: 'center' },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: { marginRight: 8 },
  closeButton: {
    alignSelf: 'flex-end',
  },
})

export default SessionRequest
