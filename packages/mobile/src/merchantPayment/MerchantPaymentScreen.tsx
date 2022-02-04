import { ContractKit } from '@celo/contractkit'
import { Charge, ContractKitTransactionHandler } from '@celo/payments-sdk'
import { BusinessData } from '@celo/payments-types'
import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { UnlockableWallet } from '@celo/wallet-base'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { showError, showMessage } from 'src/alert/actions'
import ContactCircle from 'src/components/ContactCircle'
import FeeDrawer from 'src/components/FeeDrawer'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { useFeeCurrency } from 'src/fees/hooks'
import { estimateFee, FeeType } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { useCurrencyToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigateBack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getPassword, retrieveOrGeneratePepper } from 'src/pincode/authentication'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { fetchTokenBalances } from 'src/tokens/reducer'
import { Currency } from 'src/utils/currencies'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { getContractKitAsync } from 'src/web3/contracts'
import { isDekRegisteredSelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.MerchantPayment>

function MerchantPaymentScreen({ route }: Props) {
  const { params: routeParams } = route
  const { t } = useTranslation()
  const e164PhoneNumber = useSelector(e164NumberSelector)
  // const e164PhoneNumber = '+18016160347'
  const dispatch = useDispatch() as (...args: unknown[]) => void
  const [sdkCharge, setSdkCharge] = useState<Charge | null>(null)
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const isLoading = !business
  const [amount, setAmount] = useState(new BigNumber(0))
  const [submitting, setSubmitting] = useState(false)
  // const [kit, setKit] = useState<ContractKit>()
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const feeEstimates = useSelector(feeEstimatesSelector)
  const feeCurrency = useFeeCurrency()
  const tokenInfo = useTokenInfoBySymbol(Currency.Dollar)
  const tokenAddress = tokenInfo?.address!
  const feeEstimate = feeEstimates[tokenAddress]?.[FeeType.SEND]
  const storedDekFee = feeEstimates[tokenAddress]?.[FeeType.REGISTER_DEK]
  const localToFeeExchangeRate = useCurrencyToLocalAmount(new BigNumber(1), feeCurrency)
  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false

  useEffect(() => {
    dispatch(fetchTokenBalances())
  }, [dispatch])

  useEffect(() => {
    if (tokenAddress) {
      dispatch(estimateFee({ feeType: FeeType.SEND, tokenAddress }))
    }
  }, [tokenAddress])

  useEffect(() => {
    if (!isDekRegistered) {
      dispatch(estimateFee({ feeType: FeeType.REGISTER_DEK, tokenAddress }))
    }
  }, [isDekRegistered])

  const submitPayment = useCallback(async () => {
    if (sdkCharge && !submitting) {
      setSubmitting(true)
      try {
        await sdkCharge.submit({ phoneNumber: e164PhoneNumber })
        setSubmitting(false)
        dispatch(showMessage(t('merchantPaymentSubmitSuccess')))
        navigateHome()
      } catch (e) {
        console.error('Ouch', e)
        setSubmitting(false)
        dispatch(showError(t('merchantPaymentSubmitFail')))
      }
    }
  }, [sdkCharge, dispatch, submitting])

  const initCharge = useCallback(async (kit: ContractKit) => {
    if (!kit) {
      throw new Error('Missing kit')
    }

    const chainHandler = new ContractKitTransactionHandler(kit)
    const charge = new Charge(routeParams.apiBase, routeParams.referenceId, chainHandler, true)
    console.log('CHARGE_CREATED', charge)
    try {
      const info = await charge.getInfo()
      console.log('CHARGE_INFO', info)
      setSdkCharge(charge)
      setAmount(divideByWei(new BigNumber(info.action.amount)).decimalPlaces(2))
      setBusiness(info.receiver.businessData)
    } catch (e: unknown) {
      const error = e as Error
      Logger.error('Ooooof', error.message, error)
      dispatch(showError(t('merchantPaymentSetup')))
      navigateBack()
    }
  }, [])

  useEffect(() => {
    void (async () => {
      const kit = await getContractKitAsync()
      const wallet = kit.getWallet()! as UnlockableWallet
      const [account, dekAddress] = wallet.getAccounts()
      await wallet.unlockAccount(account, await getPassword(account), 600)
      await wallet.unlockAccount(dekAddress, await retrieveOrGeneratePepper(), 600)

      if (!wallet.isAccountUnlocked(account) || !wallet.isAccountUnlocked(dekAddress)) {
        dispatch(showError(t('merchantWalletUnlockError')))
      }

      void initCharge(kit)
    })()
  }, [])

  const FeeContainer = () => {
    const currencyInfo = {
      localCurrencyCode,
      localExchangeRate: localToFeeExchangeRate?.toString() ?? '',
    }

    const securityFee = feeEstimate?.usdFee ? new BigNumber(feeEstimate.usdFee) : undefined
    const dekFee = storedDekFee?.usdFee ? new BigNumber(storedDekFee.usdFee) : undefined
    const totalFee = securityFee?.plus(dekFee ?? 0)

    return (
      <View style={styles.feeContainer}>
        <FeeDrawer
          testID={'feeDrawer/SendConfirmation'}
          isEstimate={true}
          currency={feeCurrency}
          securityFee={securityFee}
          showDekfee={!isDekRegistered}
          dekFee={dekFee}
          feeLoading={feeEstimate?.loading || storedDekFee?.loading}
          feeHasError={feeEstimate?.error || storedDekFee?.error}
          totalFee={totalFee}
          currencyInfo={currencyInfo}
          showLocalAmount={true}
        />
        <TokenTotalLineItem
          tokenAmount={amount}
          tokenAddress={tokenAddress}
          feeToAddInUsd={totalFee}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.greenBrand} />
        </View>
      )}
      {!isLoading && (
        <ReviewFrame
          FooterComponent={FeeContainer}
          confirmButton={{
            action: submitPayment,
            text: t('send'),
            disabled: submitting || !feeEstimate?.feeInfo,
          }}
          isSending={submitting}
        >
          <View style={styles.transferContainer}>
            <Text style={styles.description}>{t('merchantMoneyEscrow')}</Text>
            <View style={styles.headerContainer}>
              <ContactCircle
                recipient={{
                  name: business?.name,
                  // thumbnailPath: business?.imageUrl, // TODO
                  thumbnailPath: 'https://placekitten.com/100/100',
                  address: 'address', // TODO merchant address
                }}
              />
              <View style={styles.recipientInfoContainer}>
                <Text style={styles.headerText} testID="HeaderText">
                  {t('sending')}
                </Text>
                <Text style={styles.displayName}>{business?.name}</Text>
              </View>
            </View>
            <TokenDisplay
              style={styles.amount}
              amount={amount}
              tokenAddress={tokenAddress}
              showLocalAmount={true}
            />
            {!!business && (
              <View>
                <Text style={styles.address}>
                  {business.legalName}
                  {'\n'}
                  {business.address.line1}
                  {'\n'}
                  {business.address.line2}
                  {'\n'}
                  {business.address.city}, {business.address.state + ' '}
                  {business.address.postalCode}
                  {'\n'}
                  {business.address.country}
                  {'\n'}
                </Text>
              </View>
            )}
          </View>
        </ReviewFrame>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    paddingTop: '75%',
  },
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  description: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingBottom: 24,
  },
  transferContainer: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  address: {
    ...fontStyles.regular,
    paddingRight: 4,
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
})

export default MerchantPaymentScreen
