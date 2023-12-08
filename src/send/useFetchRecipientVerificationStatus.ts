import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { fetchAddressesAndValidate, fetchAddressVerification } from 'src/identity/actions'
import {
  e164NumberToAddressSelector,
  addressToVerificationStatusSelector,
} from 'src/identity/selectors'
import { RecipientVerificationStatus } from 'src/identity/types'
import { getRecipientVerificationStatus, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'

const useFetchRecipientVerificationStatus = () => {
  const [recipient, setRecipient] = useState<Recipient | null>(null)
  const [recipientVerificationStatus, setRecipientVerificationStatus] = useState(
    RecipientVerificationStatus.UNKNOWN
  )

  const useNewAddressVerificationBehavior = getFeatureGate(
    StatsigFeatureGates.USE_NEW_RECIPIENT_SCREEN
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

    if (selectedRecipient?.e164PhoneNumber) {
      dispatch(fetchAddressesAndValidate(selectedRecipient.e164PhoneNumber))
    } else if (selectedRecipient?.address) {
      if (
        addressToVerificationStatus[selectedRecipient.address] ||
        !useNewAddressVerificationBehavior
      ) {
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
