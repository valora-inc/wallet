import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountNumber from 'src/components/AccountNumber'
import BackButton from 'src/components/BackButton'
import Button from 'src/components/Button'
import ListItem from 'src/components/ListItem'
import SendBar from 'src/home/SendBar'
import i18n from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

export const externalExchangesScreenOptions = () => {
  const eventName = FiatExchangeEvents.cico_external_exchanges_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: i18n.t('exchanges'),
  }
}

export interface ExternalExchangeProvider {
  name: string
  link: string
  currencies: Currency[]
  supportedRegions?: string[]
}

type Props = NativeStackScreenProps<StackParamList, Screens.ExternalExchanges>

function ExternalExchanges({ route }: Props) {
  const { t } = useTranslation()
  const account = useSelector(currentAccountSelector)
  const isCashIn = route.params?.isCashIn ?? true
  const providers = route.params?.exchanges

  const goToExchange = (provider: ExternalExchangeProvider) => {
    const { name, link } = provider
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.external_exchange_link, {
        name,
        link,
        isCashIn,
      })
      navigateToURI(link)
    }
  }

  const goToCashOut = () => {
    navigate(Screens.WithdrawCeloScreen, { isCashOut: true })
    ValoraAnalytics.track(FiatExchangeEvents.cico_celo_exchange_send_bar_continue)
  }

  return (
    <SafeAreaView style={styles.container}>
      {isCashIn ? (
        <>
          <Text style={styles.pleaseSelectExchange}>
            {t('youCanTransferIn', {
              digitalAsset: route.params.currency,
            })}
          </Text>
          <View testID="accountBox" style={styles.accountBox}>
            <Text style={styles.accountLabel}>{t('accountAddressLabel')}</Text>
            <AccountNumber address={account || ''} location={Screens.ExternalExchanges} />
          </View>
        </>
      ) : (
        <Text style={styles.pleaseSelectExchange}>
          {t('youCanTransferOut', {
            digitalAsset: route.params.currency,
          })}
        </Text>
      )}

      <ScrollView style={styles.exchangesContainer}>
        {providers?.map((provider, index) => {
          return (
            <ListItem testID="provider" key={provider.name} onPress={goToExchange(provider)}>
              <View testID={`provider-${index}`} style={styles.providerListItem}>
                <Text style={styles.optionTitle}>{provider.name}</Text>
                <LinkArrow />
              </View>
            </ListItem>
          )
        })}
      </ScrollView>
      {!isCashIn && providers?.length ? (
        route.params.currency === CiCoCurrency.CELO ? (
          <View style={styles.buttonContainer}>
            <Button
              testID="WithdrawCeloButton"
              style={styles.celoOutButton}
              text={t('withdrawToken', {
                token: route.params.currency,
              })}
              onPress={() => goToCashOut()}
            />
          </View>
        ) : (
          <SendBar skipImport={true} selectedCurrency={route.params.currency} />
        )
      ) : (
        <></>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: variables.contentPadding,
  },
  pleaseSelectExchange: {
    ...fontStyles.regular,
    paddingHorizontal: variables.contentPadding,
    paddingBottom: variables.contentPadding,
  },
  accountBox: {
    borderRadius: 4,
    backgroundColor: colors.gray2,
    flexDirection: 'column',
    padding: variables.contentPadding,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  accountLabel: {
    ...fontStyles.label,
    color: colors.gray5,
  },
  providerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 4,
  },
  exchangesContainer: {
    paddingRight: variables.contentPadding,
  },
  optionTitle: {
    flex: 3,
    ...fontStyles.regular,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 12,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
  celoOutButton: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
})

export default ExternalExchanges
