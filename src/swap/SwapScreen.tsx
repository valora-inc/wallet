import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button, { BtnSizes } from 'src/components/Button'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { styles as headerStyles } from 'src/navigator/Headers'
import { Spacing } from 'src/styles/styles'
import SwapAmountInput from 'src/swap/SwapAmountInput'
import { tokensByAddressSelector } from 'src/tokens/selectors'

export function SwapScreen() {
  const { t } = useTranslation()
  const tokenList = useSelector(tokensByAddressSelector)
  const token = Object.values(tokenList)[1]!
  const handleReview = () => {}

  const allowReview = false

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <DrawerTopBar
        middleElement={<Text style={headerStyles.headerTitle}>{t('swapScreen.title')}</Text>}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.swapAmountsContainer}>
          <SwapAmountInput
            label={t('swapScreen.swapFrom')}
            onInputChange={() => {}}
            inputValue="0.00"
            onPressMax={() => {}}
            onSelectToken={() => {}}
            token={token}
          />
          <SwapAmountInput
            label={t('swapScreen.swapTo')}
            onInputChange={() => {}}
            inputValue="0.00"
            onPressMax={() => {}}
            onSelectToken={() => {}}
            token={token}
          />
        </View>

        <Button
          onPress={handleReview}
          text={t('swapScreen.review')}
          size={BtnSizes.FULL}
          disabled={allowReview}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.Regular16,
    flex: 1,
  },
  swapAmountsContainer: {
    paddingBottom: Spacing.Thick24,
  },
})

export default SwapScreen
