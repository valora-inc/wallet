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
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { acceptRequest, denyRequest } from 'src/walletConnect/actions'
import { getSessions } from 'src/walletConnect/selectors'

const TAG = 'WalletConnect/RequestScreen'

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

  const onMoreInfo = () => {
    navigate(Screens.DappKitTxDataScreen, {
      dappKitData: request.request.params,
    })
  }

  const session = sessions.find((s) => s.topic === request.topic)

  return (
    <SafeAreaView style={styles.container}>
      <TopBarTextButton title={t('cancel')} onPress={onDeny} titleStyle={styles.cancelButton} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>
          {t('connectToWallet', { dappName: session?.peer.metadata.name })}
        </Text>

        <Text style={styles.share}> {t('shareInfo')} </Text>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionHeaderText}>{t('transaction.operation')}</Text>
          <Text style={styles.bodyText}>{t('transaction.signTX')}</Text>
          <Text style={styles.sectionHeaderText}>{t('transaction.data')}</Text>
          <TouchableOpacity onPress={onMoreInfo}>
            <Text style={[styles.bodyText, styles.underLine]}>{t('transaction.details')}</Text>
          </TouchableOpacity>
        </View>

        <Button
          style={styles.button}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.MEDIUM}
          text={t('allow')}
          onPress={onAccept}
          testID="DappkitAllow"
        />
      </ScrollView>
      <TopBarTextButton title={t('cancel')} onPress={onDeny} titleStyle={styles.cancelButton} />
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

  bodyText: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  underLine: {
    textDecorationLine: 'underline',
  },
})
