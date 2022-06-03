import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import { acceptSession, denySession } from 'src/walletConnect/v1/actions'
import { selectPendingSessions } from 'src/walletConnect/v1/selectors'

type Props = {
  navigation: StackNavigationProp<StackParamList, Screens.WalletConnectRequest>
}

function SessionRequest({ navigation }: Props) {
  const { t } = useTranslation()
  const [isAccepting, setIsAccepting] = useStateWithCallback(false)
  const [isDenying, setIsDenying] = useStateWithCallback(false)
  const dispatch = useDispatch()

  const pendingSessions = useSelector(selectPendingSessions)
  // there should only be one pending session at a time, the most recent
  // request is the last item in the array
  const session = pendingSessions[pendingSessions.length - 1]

  const confirm = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsAccepting(true, () => dispatch(acceptSession(session)))
  }

  const deny = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsDenying(true, () => dispatch(denySession(session)))
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
    [navigation, session, isLoading]
  )

  const { url, name, icons } = session.params[0].peerMeta
  const fallbackIcon = icons[0] ?? `${url}/favicon.ico`

  return (
    <>
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
})

export default SessionRequest
