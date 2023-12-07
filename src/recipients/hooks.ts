import {
  e164NumberToAddressSelector,
  addressToVerificationStatusSelector,
} from 'src/identity/selectors'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'

export function useRecipientVerificationStatus(recipient: Recipient) {
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const addressToVerificationStatus = useSelector(addressToVerificationStatusSelector)
  return getRecipientVerificationStatus(recipient, e164NumberToAddress, addressToVerificationStatus)
}
