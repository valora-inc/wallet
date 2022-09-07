import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { StackNavigationOptions, StackScreenProps } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TextButton from 'src/components/TextButton'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import StaticTransactionFeed from 'src/transactions/feed/TransactionFeedCached'

type Props = StackScreenProps<StackParamList, Screens.TransactionHistoryFiltered>

function TransactionHistory({ navigation, route }: Props) {
  const { t } = useTranslation()
  const { isExporting, month, minAmount, maxAmount, recipient } = route.params || {}

  const handleClose = () => {
    navigation.setParams({ isExporting: false })
  }

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  return (
    <SafeAreaView style={styles.container}>
      <StaticTransactionFeed
        month={month}
        minAmount={minAmount}
        maxAmount={maxAmount}
        recipient={recipient}
      />
      {isExporting ? (
        <BottomSheet
          snapPoints={['33%']}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          onClose={handleClose}
        >
          <View style={styles.innerContainer}>
            <Text style={styles.title}>{t('exportPrompt.title')}</Text>
            <Text style={styles.details}>
              {t('exportPrompt.details', { month: route.params?.month })}
            </Text>
            <Button
              style={styles.button}
              type={BtnTypes.BRAND_SECONDARY}
              size={BtnSizes.FULL}
              text={t('exportPrompt.continue')}
              onPress={() => {}}
            />
          </View>
        </BottomSheet>
      ) : null}
    </SafeAreaView>
  )
}

TransactionHistory.navigationOptions = ({
  navigation,
  route,
}: {
  navigation: any
  route: any
}): StackNavigationOptions => {
  const onExport = () => {
    navigation.setParams({ isExporting: true })
  }

  return {
    ...headerWithBackButton,
    headerTitle: route.params?.month || 'Transactions',
    headerRight: () => (
      <TextButton style={styles.exportButton} children={'Export'} onPress={onExport} />
    ),
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    ...fontStyles.h1,
    textAlign: 'center',
  },
  details: {
    ...fontStyles.regular,
    padding: variables.contentPadding,
  },
  innerContainer: {
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  button: {
    padding: variables.contentPadding,
  },
  exportButton: {
    ...fontStyles.small400,
    color: Colors.greenUI,
    paddingRight: variables.headerPadding,
  },
})

export default TransactionHistory
