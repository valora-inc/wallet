import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { StackNavigationOptions, StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import TextButton from 'src/components/TextButton'
import ExportSuccess from 'src/export/ExportSuccess'
import ExportTransactions from 'src/export/ExportTransactions'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { closeExport, generatePdf } from 'src/pdf/actions'
import { currentPdfLocationSelector, pdfLoadingSelector } from 'src/pdf/reducer'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import StaticTransactionFeed from 'src/transactions/feed/TransactionFeedCached'

type Props = StackScreenProps<StackParamList, Screens.TransactionHistoryFiltered>

function TransactionHistory({ navigation, route }: Props) {
  const dispatch = useDispatch()
  const [content, setContent] = useState<any>(null)
  const { isExporting, month, minAmount, maxAmount, recipient } = route.params || {}

  const loading = useSelector(pdfLoadingSelector)
  const savedPdfLocation = useSelector(currentPdfLocationSelector)

  const handleClose = () => {
    dispatch(closeExport())
    navigation.setParams({ isExporting: false })
  }

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  const handleExport = () => {
    dispatch(generatePdf(content))
  }

  return (
    <SafeAreaView style={styles.container}>
      <StaticTransactionFeed
        month={month}
        minAmount={minAmount}
        maxAmount={maxAmount}
        recipient={recipient}
        generate={setContent}
      />
      {isExporting ? (
        <BottomSheet
          snapPoints={['33%']}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          onClose={handleClose}
        >
          {!loading && !savedPdfLocation && (
            <ExportTransactions month={route.params?.month} handleExport={handleExport} />
          )}
          {!loading && savedPdfLocation && <ExportSuccess location={savedPdfLocation} />}
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
  exportButton: {
    ...fontStyles.small400,
    color: Colors.greenUI,
    paddingRight: variables.headerPadding,
  },
})

export default TransactionHistory
