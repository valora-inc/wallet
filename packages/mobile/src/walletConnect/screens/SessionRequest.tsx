import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import { getTranslationDescriptionFromAction, SupportedActions } from 'src/walletConnect/constants'
import {
  acceptSession as acceptSessionV1,
  denySession as denySessionV1,
} from 'src/walletConnect/v1/actions'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>

function acceptSession(params: Props['route']['params']) {
  return acceptSessionV1(params.session)
}

function denySession(params: Props['route']['params']) {
  return denySessionV1(params.session)
}

function getRequestInfo(params: Props['route']['params']) {
  const { peerMeta } = params.session.params[0]
  return {
    url: peerMeta.url,
    name: peerMeta.name,
    icon: peerMeta.icons[0],
    methods: [],
  }
}

function deduplicateArray<T>(array: T[]) {
  return [...new Set(array)]
}

function ActionList({ actions }: { actions: string[] }) {
  const { t } = useTranslation()

  const descriptions = deduplicateArray(
    actions.map((a) => getTranslationDescriptionFromAction(t, a as SupportedActions))
  )

  return (
    <View>
      {descriptions.map((d) => (
        <Text key={d} style={styles.actionItem}>
          {d}
        </Text>
      ))}
    </View>
  )
}

function SessionRequest({ navigation, route: { params } }: Props) {
  const { t } = useTranslation()
  const [isAccepting, setIsAccepting] = useStateWithCallback(false)
  const [isDenying, setIsDenying] = useStateWithCallback(false)
  const dispatch = useDispatch()

  const confirm = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsAccepting(true, () => dispatch(acceptSession(params)))
  }

  const deny = () => {
    // Dispatch after state has been changed to avoid triggering the 'beforeRemove' action while processing
    setIsDenying(true, () => dispatch(denySession(params)))
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
    [navigation, params, isLoading]
  )

  const { url, name, icon, methods } = getRequestInfo(params)
  const fallbackIcon = icon ?? `${url}/favicon.ico`

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <View style={styles.center}>
            <Image style={styles.logo} source={{ uri: fallbackIcon }} />
          </View>
          <Text style={styles.header} testID="SessionRequestHeader">
            {t('connectToWallet', { dappName: name })}
          </Text>

          {methods.length > 0 && <Text style={styles.subHeader}>{t('sessionInfo')}</Text>}
        </View>

        {methods.length > 0 && (
          <View style={styles.content}>
            <ActionList actions={methods} />
          </View>
        )}

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
      </ScrollView>
    </SafeAreaView>
  )
}

SessionRequest.navigationOptions = headerWithCloseButton

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    marginHorizontal: 24,
  },
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  subHeader: {
    ...fontStyles.regular,
    color: colors.gray5,
    textAlign: 'center',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  actionItem: {
    ...fontStyles.regular,
    color: colors.gray5,
    paddingBottom: 8,
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: { marginRight: 8 },
})

export default SessionRequest
