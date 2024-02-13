import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import ListItem from 'src/components/ListItem'
import SendBar from 'src/home/SendBar'
import i18n from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'

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
  const providers = route.params?.exchanges
  const tokenInfo = useTokenInfo(route.params.tokenId)

  const goToExchange = (provider: ExternalExchangeProvider) => {
    const { name, link } = provider
    return () => {
      ValoraAnalytics.track(FiatExchangeEvents.external_exchange_link, {
        name,
        link,
        isCashIn: false,
      })
      navigateToURI(link)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.pleaseSelectExchange}>
        {t('youCanTransferOut', {
          digitalAsset: tokenInfo?.symbol,
        })}
      </Text>

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
      {providers?.length ? <SendBar selectedTokenId={route.params.tokenId} /> : <></>}
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
})

export default ExternalExchanges
