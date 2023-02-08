import { Charge, ContractKitTransactionHandler } from '@celo/payments-sdk'
import { AbortCodes, BusinessData } from '@celo/payments-types'
import { UnlockableWallet } from '@celo/wallet-base'
import BigNumber from 'bignumber.js'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { BASE_TAG } from 'src/merchantPayment/constants'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { getPassword, retrieveOrGeneratePepper } from 'src/pincode/authentication'
import { divideByWei } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { getContractKitAsync } from 'src/web3/contracts'

export enum PaymentStatus {
  Initial,
  Pending,
  Errored,
  Done,
}

export function useMerchantPayments(apiBase: string, referenceId: string) {
  const LOG_TAG = BASE_TAG + 'useMerchantPayments'

  const { t } = useTranslation()
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const userLocationData = useSelector(userLocationDataSelector)
  const dispatch = useDispatch()

  const [charge, setCharge] = useState<Charge | null>(null)
  const [amount, setAmount] = useState<BigNumber>(new BigNumber(0))
  const [paymentStatus, setStatus] = useState<PaymentStatus>(PaymentStatus.Initial)
  const [businessInformation, setBusinessInformation] = useState<BusinessData | null>(null)

  const { loading, error: chargeError } = useAsync(async () => {
    const kit = await getContractKitAsync()
    const wallet = kit.getWallet()! as UnlockableWallet
    const [account, dekAddress] = wallet.getAccounts()
    await wallet.unlockAccount(account, await getPassword(account), UNLOCK_DURATION)
    await wallet.unlockAccount(dekAddress, await retrieveOrGeneratePepper(), UNLOCK_DURATION)

    // Note: both the account and the DEK need to be unlocked for the payment merchant sdk to work
    if (!wallet.isAccountUnlocked(account) || !wallet.isAccountUnlocked(dekAddress)) {
      dispatch(showError(t('merchantWalletUnlockError')))
    }

    const chainHandler = new ContractKitTransactionHandler(kit)
    const charge = new Charge(apiBase, referenceId, chainHandler, false)
    try {
      const info = await charge.getInfo()
      setCharge(charge)
      setAmount(divideByWei(new BigNumber(info.action.amount)).decimalPlaces(2))
      setBusinessInformation(info.receiver.businessData)
    } catch (e: unknown) {
      Logger.error(LOG_TAG, (e as Error).message)
      throw e
    }
  }, [])

  const submit = useCallback(async () => {
    const { countryCodeAlpha2 } = userLocationData
    if (!charge || paymentStatus === PaymentStatus.Pending) return
    setStatus(PaymentStatus.Pending)
    try {
      if (e164PhoneNumber) {
        await charge.submit({ phoneNumber: e164PhoneNumber })
      } else if (countryCodeAlpha2) {
        await charge.submit({
          address: {
            country: countryCodeAlpha2,
          },
        })
      } else {
        throw new Error('No phone number or country code')
      }
      setStatus(PaymentStatus.Done)
    } catch (e: unknown) {
      setStatus(PaymentStatus.Errored)
      Logger.error(LOG_TAG, (e as Error).message)
      throw e
    }
  }, [charge, dispatch, paymentStatus])

  const abort = useCallback(
    async (code: AbortCodes) => {
      if (!charge) return

      await charge.abort(code)
    },
    [charge]
  )

  return {
    submit,
    abort,
    amount,
    businessInformation,
    paymentStatus,
    loading: loading || !charge,
    chargeError,
  }
}
