import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View, Text, Button } from 'react-native'
import { StackScreenProps } from '@react-navigation/stack'
import { StackParamList } from 'src/navigator/types'
import { Screens } from 'src/navigator/Screens'
import { Charge, ContractKitTransactionHandler } from '@celo/payments-sdk'
import { getContractKitAsync } from 'src/web3/contracts'
import Logger from 'src/utils/Logger'
import _BigNumber from 'bignumber.js'
import { WEI_DECIMALS } from 'src/geth/consts'
import { useDispatch, useSelector } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
import { useTranslation } from 'react-i18next'
import { e164NumberSelector } from 'src/account/selectors'
import { getStoredMnemonic } from 'src/backup/utils'
import { accountAddressSelector } from 'src/web3/selectors'
import { generateKeys } from '@celo/utils/lib/account'
import { ContractKit, newKit } from '@celo/contractkit'
import { ensurePincode, navigate } from 'src/navigator/NavigationService'
import { currentAccountSelector, dataEncryptionKeySelector } from 'src/web3/selectors'

type Props = StackScreenProps<StackParamList, Screens.MerchantPayment>

function MerchantPaymentScreen({ route: { params: routeParams } }: Props) {
  // const e164PhoneNumber = useSelector(e164NumberSelector)
  const account = useSelector(accountAddressSelector)
  const dek = useSelector(dataEncryptionKeySelector)
  const e164PhoneNumber = '+18016160347'
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [sdkCharge, setSdkCharge] = useState<Charge | null>(null)
  const [business, setBusiness] = useState('Loading')
  const [amount, setAmount] = useState('Loading')
  const [submitting, setSubmitting] = useState(false)
  const [kit, setKit] = useState<ContractKit>()
  const submitPayment = useCallback(async () => {
    if (sdkCharge && kit && dek) {
      setSubmitting(true)
      try {
        await sdkCharge.submit({ phoneNumber: e164PhoneNumber })
        setSubmitting(false)
        dispatch(showMessage(t('merchantPaymentSubmitSuccess')))
      } catch (e) {
        console.error('Ouch', e)
        setSubmitting(false)
        dispatch(showError(t('merchantPaymentSubmitFail')))
      }
    }
  }, [sdkCharge, dispatch])
  useEffect(() => {
    if (!dek || !account || kit) return
    void (async function () {
      const kit = newKit('https://alfajores-forno.celo-testnet.org')
      const BigNumber = _BigNumber.clone({ DECIMAL_PLACES: 2 })
      const mnemonic = await getStoredMnemonic(account)
      const keys = await generateKeys(mnemonic || '')
      kit.addAccount(keys.privateKey)
      kit.addAccount(dek)
      setKit(kit)
      const chainHandler = new ContractKitTransactionHandler(kit)
      const charge = new Charge(routeParams.apiBase, routeParams.referenceId, chainHandler, true)
      setSdkCharge(charge)
      try {
        const info = await charge.getInfo()
        const bigAmt = new BigNumber(info.action.amount)
        const readableAmt = bigAmt
          .dividedBy(new BigNumber(10).pow(WEI_DECIMALS))
          .toPrecision()
          .toString()
        setBusiness(info.receiver.businessData.name)
        setAmount(`${readableAmt} ${info.action.currency}`)
      } catch (e) {
        Logger.error('Oooof', e)
      }
    })()
  }, [])

  return (
    <SafeAreaView>
      <View>
        <Text>Sending to: {business}</Text>
        <Text>Amount: {amount}</Text>
        <Button title="Send" onPress={submitPayment}>
          {submitting ? 'Submitting Payment' : 'Send'}
        </Button>
      </View>
    </SafeAreaView>
  )
}

export default MerchantPaymentScreen
