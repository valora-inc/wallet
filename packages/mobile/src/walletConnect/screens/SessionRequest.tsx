import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import PhoneNumberWithFlag from '@celo/react-components/components/PhoneNumberWithFlag'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import AccountNumber from 'src/components/AccountNumber'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { acceptSession, denySession } from 'src/walletConnect/actions'
import { selectPendingSession } from 'src/walletConnect/selectors'
import { humanReadableAction, SupportedActions } from '../constants'

const TAG = 'WalletConnect/RequestScreen'

function ActionList({ actions }: { actions: string[] }) {
  const descriptions = [...new Set(actions.map((a) => humanReadableAction(a as SupportedActions)))]

  return (
    <View>
      {descriptions.map((d) => (
        <Text>{d}</Text>
      ))}
    </View>
  )
}

type RouteProps = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>
type Props = RouteProps

export default function WalletConnectRequestScreen(props: Props) {
  const session = useSelector(selectPendingSession)
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()
  console.log('>>> WalletConnectRequestScreen', JSON.stringify(session))

  if (!session) {
    return null
  }

  const confirm = () => {
    dispatch(acceptSession(session))
    navigate(Screens.WalletConnectSessions)
  }

  const deny = () => {
    dispatch(denySession(session))
    navigate(Screens.WalletConnectSessions)
  }

  const icon = session.proposer.metadata.icons[0] || `${session.proposer.metadata.url}/favicon.ico`
  return (
    <SafeAreaView style={styles.container}>
      {/* <TopBarTextButton title={t('cancel')} onPress={cancel} titleStyle={styles.cancelButton} /> */}

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <Image
            style={{ height: 40, width: 40, marginBottom: 12 }}
            source={{ uri: icon }}
            height={40}
            width={40}
          />
        </View>
        <Text style={styles.header}>
          {t('connectToWallet', { dappName: session.proposer.metadata.name })}
        </Text>

        <Text style={styles.share}>{t('sessionInfo')}</Text>

        <ItemSeparator />

        <ActionList actions={session.permissions.jsonrpc.methods} />

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionHeaderText}>{t('phoneNumber')}</Text>
          <PhoneNumberWithFlag e164PhoneNumber={''} />
          <Text style={styles.sectionHeaderText}>{t('address')}</Text>
          <AccountNumber address={''} location={Screens.DrawerNavigator} />
        </View>

        <View>
          <Button
            style={styles.button}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.MEDIUM}
            text={t('cancel')}
            onPress={deny}
          />
          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={confirm}
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
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingHorizontal: 30,
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
})
