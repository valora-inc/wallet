import { useEffect, useState } from 'react'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import { fetchAddressVerification, fetchAddressesAndValidate } from 'src/identity/actions'
import {
  addressToVerificationStatusSelector,
  e164NumberToAddressSelector,
} from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { Recipient, RecipientType, getRecipientVerificationStatus } from 'src/recipients/recipient'
import { useDispatch, useSelector } from 'src/redux/hooks'

const useFetchRecipientVerificationStatus = () => {
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [recipientVerificationStatus, setRecipientVerificationStatus] = useState(
    RecipientVerificationStatus.UNKNOWN
  )

  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const addressToVerificationStatus = useSelector(addressToVerificationStatusSelector)
  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)
  const dispatch = useDispatch()

  const unsetSelectedRecipient = () => {
    setRecipient(null)
    setRecipientVerificationStatus(RecipientVerificationStatus.UNKNOWN)
  }

  const setSelectedRecipient = (selectedRecipient: Recipient) => {
    setRecipient(selectedRecipient)
    setRecipientVerificationStatus(RecipientVerificationStatus.UNKNOWN)

    // phone recipients should always have a number, the extra check is to ensure typing
    if (
      selectedRecipient.recipientType === RecipientType.PhoneNumber &&
      selectedRecipient.e164PhoneNumber
    ) {
      dispatch(fetchAddressesAndValidate(selectedRecipient.e164PhoneNumber))
    } else if (selectedRecipient?.address) {
      if (addressToVerificationStatus[selectedRecipient.address]) {
        setRecipientVerificationStatus(RecipientVerificationStatus.VERIFIED)
      } else if (phoneNumberVerified) {
        dispatch(fetchAddressVerification(selectedRecipient.address))
      } else {
        setRecipientVerificationStatus(RecipientVerificationStatus.UNVERIFIED)
      }
    }
  }

  useEffect(() => {
    if (recipient && recipientVerificationStatus === RecipientVerificationStatus.UNKNOWN) {
      // e164NumberToAddress is updated after a successful phone number lookup,
      // addressToVerificationStatus is updated after a successful address lookup
      setRecipientVerificationStatus(
        getRecipientVerificationStatus(recipient, e164NumberToAddress, addressToVerificationStatus)
      )
    }
  }, [e164NumberToAddress, addressToVerificationStatus, recipient, recipientVerificationStatus])

  return {
    recipient,
    setSelectedRecipient,
    unsetSelectedRecipient,
    recipientVerificationStatus,
  }
}

export default useFetchRecipientVerificationStatus
