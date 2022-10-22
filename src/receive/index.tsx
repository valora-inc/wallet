import { parseInputAmount } from '@celo/utils/lib/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { e164NumberSelector, nameSelector } from 'src/account/selectors'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AmountKeypad from 'src/components/AmountKeypad'
import { NUMBER_INPUT_MAX_DECIMALS } from 'src/config'
import { convertToMaxSupportedPrecision } from 'src/localCurrency/convert'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import QRCode from 'src/qrcode/QRCode'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import ReceiveAmountHeader from 'src/receive/ReceiveAmountHeader'
import ReceiveAmountValue from 'src/receive/ReceiveAmountValue'
import { Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { SVG } from 'src/send/actions'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import variables from 'src/styles/variables'
import {
  useAmountAsUsd,
  useLocalToTokenAmount,
  useTokenInfo,
  useTokenToLocalAmount,
} from 'src/tokens/hooks'
import { fetchTokenBalances } from 'src/tokens/reducer'
import { defaultTokenToReceiveSelector } from 'src/tokens/selectors'
import { currentAccountSelector } from 'src/web3/selectors'

const MAX_ESCROW_VALUE = new BigNumber(20)
const LOCAL_CURRENCY_MAX_DECIMALS = 2
const TOKEN_MAX_DECIMALS = 8

export interface TransactionDataInput {
  recipient: Recipient
  inputAmount: BigNumber
  amountIsInLocalCurrency: boolean
  tokenAddress: string
  tokenAmount: BigNumber
  comment?: string
}

type RouteProps = StackScreenProps<StackParamList, Screens.SendAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

export function useInputAmounts(
  inputAmount: string,
  usingLocalAmount: boolean,
  tokenAddress: string,
  inputTokenAmount?: BigNumber
) {
  const parsedAmount = parseInputAmount(inputAmount, decimalSeparator)
  const localToToken = useLocalToTokenAmount(parsedAmount, tokenAddress)
  const tokenToLocal = useTokenToLocalAmount(parsedAmount, tokenAddress)

  const localAmountRaw = usingLocalAmount ? parsedAmount : tokenToLocal
  // when using the local amount, the "inputAmount" value received here was
  // already converted once from the token value. if we calculate the token
  // value by converting again from local to token, we introduce rounding
  // precision errors. most of the time this is fine but when pressing the "max"
  // button and using the max token value this becomes a problem because the
  // precision error introduced may result in a higher token value than
  // original, preventing the user from sending the amount e.g. the max token
  // balance could be something like 15.00, after conversion to local currency
  // then back to token amount, it could be 15.000000001.
  const tokenAmountRaw = usingLocalAmount ? inputTokenAmount ?? localToToken : parsedAmount
  const localAmount = localAmountRaw && convertToMaxSupportedPrecision(localAmountRaw)
  const tokenAmount = convertToMaxSupportedPrecision(tokenAmountRaw!)

  const usdAmount = useAmountAsUsd(tokenAmount, tokenAddress)

  return {
    localAmount,
    tokenAmount,
    usdAmount: usdAmount && convertToMaxSupportedPrecision(usdAmount),
  }
}

function ReceiveAmount(props: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const qrSvgRef = useRef<SVG>()
  const [amount, setAmount] = useState('')
  const [rawAmount, setRawAmount] = useState('')
  const [usingLocalAmount, setUsingLocalAmount] = useState(true)
  const defaultToken = useSelector(defaultTokenToReceiveSelector)
  const [transferTokenAddress, setTransferToken] = useState(defaultToken)
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)
  const tokenInfo = useTokenInfo(transferTokenAddress)!
  const tokenHasUsdPrice = !!tokenInfo?.usdPrice
  const phoneNumber = useSelector(e164NumberSelector)
  const showInputInLocalAmount = usingLocalAmount && tokenHasUsdPrice

  const displayName = useSelector(nameSelector)
  const account = useSelector(currentAccountSelector)
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const { tokenAmount, localAmount, usdAmount } = useInputAmounts(
    rawAmount,
    showInputInLocalAmount,
    transferTokenAddress
  )

  const [qrContent, setQrContent] = useState<Partial<UriData>>({
    address: account!,
    displayName: displayName || account || undefined,
    e164PhoneNumber: phoneNumber || undefined,
    currencyCode: localCurrencyCode,
    amount: amount,
    token: tokenInfo.symbol,
  })

  const onSwapInput = () => {
    onAmountChange('')
    setUsingLocalAmount(!usingLocalAmount)
    ValoraAnalytics.track(SendEvents.swap_input_pressed, {
      tokenAddress: transferTokenAddress,
      swapToLocalAmount: !usingLocalAmount,
    })
  }

  const onAmountChange = (updatedAmount: string) => {
    setAmount(updatedAmount)
    setRawAmount(updatedAmount)
  }

  useEffect(() => {
    dispatch(fetchTokenBalances())
  }, [])

  useEffect(() => {
    onAmountChange('')
  }, [transferTokenAddress])

  useEffect(() => {
    setQrContent({
      ...qrContent,
      currencyCode: localCurrencyCode,
      amount: amount,
      comment: '',
      token: tokenInfo.symbol,
    })
  }, [localCurrencyCode, amount, tokenInfo])

  return (
    <SafeAreaView style={styles.container}>
      <ReceiveAmountHeader
        tokenAddress={transferTokenAddress}
        onChangeToken={setTransferToken}
        disallowCurrencyChange={false}
      />
      <DisconnectBanner />
      <View style={styles.contentContainer}>
        <QRCode isForScanToSend={true} content={urlFromUriData(qrContent)} qrSvgRef={qrSvgRef} />
        <ReceiveAmountValue
          inputAmount={amount}
          tokenAmount={tokenAmount}
          usingLocalAmount={showInputInLocalAmount}
          tokenAddress={transferTokenAddress}
          onSwapInput={onSwapInput}
          tokenHasUsdPrice={tokenHasUsdPrice}
        />
        <AmountKeypad
          amount={amount}
          maxDecimals={showInputInLocalAmount ? NUMBER_INPUT_MAX_DECIMALS : TOKEN_MAX_DECIMALS}
          onAmountChange={onAmountChange}
        />
      </View>
    </SafeAreaView>
  )
}

ReceiveAmount.navigationOptions = noHeader

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
})

export default ReceiveAmount
