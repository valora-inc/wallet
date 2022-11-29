import { UnlockableWallet } from '@celo/wallet-base'
import BigNumber from 'bignumber.js'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
// import { useDispatch, useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { BASE_TAG } from 'src/merchantPayment/constants'
import { getPassword, retrieveOrGeneratePepper } from 'src/pincode/authentication'
import Logger from 'src/utils/Logger'
import { UNLOCK_DURATION } from 'src/web3/consts'
// import { e164NumberSelector } from 'src/verify/reducer'
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
  // const e164PhoneNumber = useSelector(e164NumberSelector)
  const dispatch = useDispatch()

  const [amount] = useState<BigNumber>(new BigNumber(0))
  const [paymentStatus, setStatus] = useState<PaymentStatus>(PaymentStatus.Initial)

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
  }, [])

  const submit = useCallback(async () => {
    setStatus(PaymentStatus.Pending)
    try {
      // Temporarily disabled for celo connect
      // await charge.submit({ phoneNumber: e164PhoneNumber })
      setStatus(PaymentStatus.Done)
    } catch (e: unknown) {
      setStatus(PaymentStatus.Errored)
      Logger.error(LOG_TAG, (e as Error).message)
      throw e
    }
  }, [dispatch, paymentStatus])

  const abort = useCallback(async (code: any) => {
    return
  }, [])

  return {
    submit,
    abort,
    amount,
    paymentStatus,
    loading: loading,
    chargeError,
  }
}
