import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'

const { contentPadding } = variables

interface OwnProps<T> {
  listItemRenderer: (item: T, key: number) => JSX.Element
  items: T[]
}

type Props<T> = OwnProps<T>

export function NotificationList<T>(props: Props<T>) {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.container}>
      <DisconnectBanner />
      {props.items.length > 0 ? (
        <ScrollView>
          <View style={styles.scrollArea}>{props.items.map(props.listItemRenderer)}</View>
        </ScrollView>
      ) : (
        <Text style={[fontStyles.regular, styles.empty]}>{t('emptyList')}</Text>
      )}
    </SafeAreaView>
  )
}

export function titleWithBalanceNavigationOptions(title: string) {
  return {
    ...headerWithBackButton,
    headerTitle: <HeaderTitleWithBalance title={title} token={Currency.Dollar} />,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollArea: {
    margin: contentPadding,
  },
  empty: {
    textAlign: 'center',
    marginTop: 30,
  },
})
