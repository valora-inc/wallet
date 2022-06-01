import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import fontStyles from 'src/styles/fonts'
import TransactionFeed from 'src/transactions/feed/TransactionFeed'

function TransactionHistory() {
  const { t } = useTranslation()

  const topBarTitle = () => <Text style={styles.title}>{t('history')}</Text>

  return (
    <SafeAreaView>
      <DrawerTopBar middleElement={topBarTitle()} />
      <TransactionFeed />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  title: {
    ...fontStyles.navigationHeader,
  },
})

export default TransactionHistory
