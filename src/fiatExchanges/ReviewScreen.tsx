import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import LineItemRow from 'src/components/LineItemRow'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CICOFlow } from './utils'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReview>

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const { t } = useTranslation()

  // TODO(satish): get all hardcoded fields from props
  const { flow } = route.params

  return (
    <SafeAreaView style={styles.content}>
      <View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>20.01 cUSD</Text>
        </View>
        <TransactionDetails flow={flow} />
        <PaymentMethod />
      </View>
      <Button
        style={styles.submitBtn}
        type={BtnTypes.PRIMARY}
        size={BtnSizes.FULL}
        text={
          flow === CICOFlow.CashIn
            ? t('fiatExchangeFlow.cashIn.fiatConnectReviewButton')
            : t('fiatExchangeFlow.cashOut.fiatConnectReviewButton')
        }
        onPress={() => {}}
      />
    </SafeAreaView>
  )
}

function TransactionDetails({ flow }: { flow: CICOFlow }) {
  const { t } = useTranslation()
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>
        {t('fiatConnectReviewScreen.transactionDetails')}
      </Text>
      <LineItemRow
        style={styles.sectionMainTextContainer}
        textStyle={styles.sectionMainText}
        title={
          flow === CICOFlow.CashIn
            ? t('fiatExchangeFlow.cashIn.transactionDetailsAmount')
            : t('fiatExchangeFlow.cashOut.transactionDetailsAmount')
        }
        amount="$20.00"
      />
      <LineItemRow
        title="25 cUSD @ $1.00"
        amount="20.0010 cUSD"
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
      />
      <LineItemRow
        title={t('feeEstimate')}
        amount="$3.99"
        style={styles.sectionSubTextContainer}
        textStyle={styles.sectionSubText}
      />
    </View>
  )
}

function PaymentMethod() {
  const { t } = useTranslation()
  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeaderText}>{t('fiatConnectReviewScreen.paymentMethod')}</Text>
      <View style={styles.paymentMethodContainer}>
        <View style={styles.paymentMethodDetails}>
          <View style={styles.sectionMainTextContainer}>
            <Text style={styles.sectionMainText}>Visa (...4666)</Text>
          </View>
          <View style={styles.sectionSubTextContainer}>
            <Text style={styles.sectionSubText}>Via OzzyPay | Est 3-10 business days</Text>
          </View>
        </View>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                'https://firebasestorage.googleapis.com/v0/b/celo-mobile-mainnet.appspot.com/o/images%2Framp.png?alt=media',
            }}
            style={styles.paymentImage}
            resizeMode="center"
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  amountContainer: {
    paddingVertical: 32,
  },
  amountText: {
    ...fontStyles.largeNumber,
    textAlign: 'center',
  },
  sectionContainer: {
    marginHorizontal: variables.contentPadding,
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingVertical: 24,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    color: colors.gray3,
    marginBottom: 8,
  },
  sectionMainTextContainer: {
    marginVertical: 0,
  },
  sectionMainText: {
    ...fontStyles.regular500,
  },
  sectionSubTextContainer: {
    marginVertical: 2,
  },
  sectionSubText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
  paymentMethodContainer: {
    flexDirection: 'row',
  },
  paymentMethodDetails: {
    flex: 1,
  },
  submitBtn: {
    flexDirection: 'column',
    paddingHorizontal: variables.contentPadding,
    marginBottom: 24,
  },
  imageContainer: {
    width: 40,
    height: 40,
  },
  paymentImage: {
    flex: 1,
  },
})

FiatConnectReviewScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReview>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatExchangeFlow.cashIn.fiatConnectReviewHeader`)
      : i18n.t(`fiatExchangeFlow.cashOut.fiatConnectReviewHeader`),
})
