import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import BackButton from 'src/components/BackButton'
import ListItem from 'src/components/ListItem'
import { SPEND_MERCHANT_LINKS } from 'src/config'
import i18n from 'src/i18n'
import LinkArrow from 'src/icons/LinkArrow'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { navigateToURI } from 'src/utils/linking'

export const spendScreenOptions = () => {
  const eventName = FiatExchangeEvents.cico_spend_select_provider_back

  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={eventName} />,
    headerTitle: i18n.t('spend'),
  }
}

export interface SpendMerchant {
  name: string
  link: string
  subtitleKey?: string
}

type Props = NativeStackScreenProps<StackParamList, Screens.Spend>

function Spend(props: Props) {
  const goToMerchant = (merchant: SpendMerchant) => {
    const { name, link } = merchant
    return () => {
      AppAnalytics.track(FiatExchangeEvents.spend_merchant_link, {
        name,
        link,
      })
      navigateToURI(link)
    }
  }

  const { t } = useTranslation()

  // TODO Dynamically fetch merchant links so they can be updated between releases
  const merchants: SpendMerchant[] = SPEND_MERCHANT_LINKS

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.pleaseSelectProvider}>{t('useBalanceWithMerchants')}</Text>
        <View>
          {merchants
            .filter((merchant) => !!merchant.link)
            .map((merchant) => {
              return (
                <ListItem key={merchant.name} onPress={goToMerchant(merchant)}>
                  <View style={styles.providerListItem}>
                    <Text style={styles.optionTitle}>{merchant.name}</Text>
                    <LinkArrow />
                  </View>
                  {!!merchant.subtitleKey && (
                    <Text style={styles.optionSubtitle}>{t(merchant.subtitleKey)}</Text>
                  )}
                </ListItem>
              )
            })}
        </View>
      </SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: variables.contentPadding,
  },
  pleaseSelectProvider: {
    ...typeScale.bodyMedium,
    paddingHorizontal: variables.contentPadding,
    paddingBottom: variables.contentPadding,
  },
  providerListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionTitle: {
    ...typeScale.bodyMedium,
  },
  optionSubtitle: {
    ...typeScale.bodySmall,
    color: colors.gray4,
  },
})

export default Spend
