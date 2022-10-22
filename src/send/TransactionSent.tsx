import { StackScreenProps, TransitionPresets } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { formatShortenedAddress } from 'src/components/ShortenedAddress'
import { CheckCircle } from 'src/icons/CheckCircle'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'

type OwnProps = StackScreenProps<StackParamList, Screens.TransactionSent>
type Props = {} & OwnProps

const TransactionSent = ({ route }: Props) => {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)
  const { transactionData } = route.params
  const {
    recipient,
    inputAmount,
    amountIsInLocalCurrency,
    tokenAddress,
    tokenAmount,
  } = transactionData
  const tokenInfo = useTokenInfo(tokenAddress)

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{t('transactionHeaderSent')}</Text>
      <View style={[styles.row, styles.glyph]}>
        <CheckCircle size={200} />
      </View>

      <View style={styles.innerContainer}>
        <View style={[styles.group]}>
          <Text style={[styles.label, styles.line]}>{t('to')}</Text>
          <Text style={[styles.line]}>{formatShortenedAddress(recipient.address ?? '')}</Text>
        </View>

        {recipient.name && (
          <View style={[styles.group]}>
            <Text style={[styles.label, styles.line]}>{t('name')}</Text>
            <Text style={[styles.line]}>{recipient.name}</Text>
          </View>
        )}

        {inputAmount && (
          <View style={[styles.group]}>
            <Text style={[styles.label, styles.line]}>{t('amount')}</Text>
            <Text style={[styles.line]}>
              {localCurrencySymbol}
              {inputAmount.toFormat(2) ?? 0.0}
            </Text>
          </View>
        )}

        {tokenAmount && (
          <View style={[styles.group]}>
            <View style={[styles.label]}></View>
            <Text style={[styles.line]}>
              {tokenAmount.toFormat(2)} {tokenInfo?.symbol}
            </Text>
          </View>
        )}
      </View>

      <Button
        style={{ marginTop: 30, paddingHorizontal: 24 }}
        text={t('continue')}
        type={BtnTypes.NOTIFICATION_SECONDARY}
        size={BtnSizes.FULL}
        onPress={navigateHome}
      />
    </SafeAreaView>
  )
}

TransactionSent.navigationOptions = {
  ...noHeader,
  ...TransitionPresets.ModalTransition,
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.greenUI,
  },
  innerContainer: {
    marginHorizontal: variables.contentPadding * 2,
    paddingHorizontal: variables.contentPadding,
    borderRadius: 8,
  },
  header: {
    ...fontStyles.h1,
    color: Colors.light,
    textAlign: 'center',
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  glyph: {
    paddingVertical: 56,
    flexGrow: 1,
  },
  group: {
    paddingVertical: 5,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  label: {
    flexGrow: 1,
  },
  line: {
    ...fontStyles.large600,
    color: Colors.light,
  },
})

export default TransactionSent
