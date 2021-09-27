import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { headerWithCloseButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useStateWithCallback from 'src/utils/useStateWithCallback'
import { getTranslationDescriptionFromAction, SupportedActions } from 'src/walletConnect/constants'
import {
  acceptSession as acceptSessionV1,
  denySession as denySessionV1,
} from 'src/walletConnect/v1/actions'
import {
  acceptSession as acceptSessionV2,
  denySession as denySessionV2,
} from 'src/walletConnect/v2/actions'

type Props = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>

function acceptSession(params: Props['route']['params']) {
  switch (params.version) {
    case 1:
      return acceptSessionV1(params.session)
    case 2:
      return acceptSessionV2(params.session)
  }
}

function denySession(params: Props['route']['params']) {
  switch (params.version) {
    case 1:
      return denySessionV1(params.session)
    case 2:
      return denySessionV2(params.session)
  }
}

function getRequestInfo(params: Props['route']['params']) {
  switch (params.version) {
    case 1:
      const { peerMeta } = params.session.params[0]
      return {
        url: peerMeta.url,
        name: peerMeta.name,
        icon: peerMeta.icons[0],
        methods: [],
      }
    case 2:
      const { metadata } = params.session.proposer
      return {
        url: metadata.url,
        name: metadata.name,
        icon: metadata.icons[0],
        methods: params.session.permissions.jsonrpc.methods,
      }
  }
}

function deduplicateArray<T>(array: T[]) {
  return [...new Set(array)]
}

function ActionList({ actions }: { actions: string[] }) {
  const descriptions = deduplicateArray(
    actions.map((a) => getTranslationDescriptionFromAction(a as SupportedActions))
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
  const { t } = useTranslation(Namespaces.walletConnect)
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
