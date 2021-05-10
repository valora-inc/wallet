import { useMemo } from 'react'
import { e164NumberToAddressSelector } from 'src/identity/reducer'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

export function useRecipientVerificationStatus(recipient: Recipient) {
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  return useMemo(() => getRecipientVerificationStatus(recipient, e164NumberToAddress), [
    recipient,
    e164NumberToAddress,
  ])
}
