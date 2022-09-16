import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { currentPdfLocationSelector, pdfLoadingSelector } from 'src/pdf/reducer'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'

type Props = {
  month?: string
  handleExport: () => void
}

const ExportTransactions = ({ month, handleExport }: Props) => {
  const { t } = useTranslation()
  const loading = useSelector(pdfLoadingSelector)
  const savedPdfLocation = useSelector(currentPdfLocationSelector)
  const disabled = loading && !savedPdfLocation
  return (
    <View style={styles.innerContainer}>
      <Text style={styles.title}>{t('exportPrompt.title')}</Text>
      <Text style={styles.details}>{t('exportPrompt.details', { month: month })}</Text>
      <Button
        style={styles.button}
        disabled={disabled}
        type={BtnTypes.BRAND_SECONDARY}
        size={BtnSizes.FULL}
        text={t('exportPrompt.continue')}
        onPress={handleExport}
      />
    </View>
  )
}

const styles = StyleSheet.create({
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
})

export default ExportTransactions
