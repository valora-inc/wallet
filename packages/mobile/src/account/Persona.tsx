import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import { generateKeys } from '@celo/utils/lib/account'
import * as React from 'react'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Inquiry, { InquiryAttributes } from 'react-native-persona'
import { useDispatch, useSelector } from 'react-redux'
import { KycStatus } from 'src/account/reducer'

import { getStoredMnemonic } from 'src/backup/utils'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import networkConfig from 'src/geth/networkConfig'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'
import { accountAddressSelector } from 'src/web3/selectors'
import { createAccount } from './persona-helpers'

const TAG = 'PERSONA'

export interface Props {
  kycStatus: KycStatus | undefined
}

const Persona = ({ kycStatus }: Props) => {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const [personaAccountCreated, setPersonaAccountCreated] = useState(!!kycStatus)

  const accountAddress = useSelector(accountAddressSelector)

  const dispatch = useDispatch()

  const templateIdResponse = useAsync(async () => readOnceFromFirebase('persona/templateId'), [])
  const templateId = templateIdResponse.result

  const launchPersonaInquiry = useCallback(() => {
    if (typeof templateId !== 'string') {
      Logger.error(TAG, `Attempted to initiate Persona with invalid templateId: ${templateId}`)
      return
    }

    if (!accountAddress) {
      Logger.error(TAG, "Can't render Persona because accountAddress is null")
      return
    }

    Inquiry.fromTemplate(templateId)
      .referenceId(accountAddress)
      .environment(networkConfig.personaEnvironment)
      .onSuccess((inquiryId: string, attributes: InquiryAttributes) => {
        Logger.info(
          TAG,
          `Inquiry completed for ${inquiryId} with attributes: ${JSON.stringify(attributes)}`
        )
        // TODO [Lisa]: Add event handling for KYC approval when Persona component is integrated
      })
      .onCancelled(() => {
        Logger.info(TAG, 'Inquiry is canceled by the user.')
      })
      .onError((error: Error) => {
        Logger.error(TAG, `Error: ${error.message}`)
      })
      .build()
      .start()
  }, [templateId])

  const getPrivateKey = async (): Promise<string> => {
    const mnemonic = await getStoredMnemonic(accountAddress)
    if (!mnemonic) {
      throw new Error('Unable to fetch mnemonic from the store')
    }
    const keys = await generateKeys(mnemonic)
    return keys?.privateKey
  }

  useAsync(
    () =>
      createAccount(
        getPrivateKey,
        dispatch,
        personaAccountCreated,
        accountAddress,
        setPersonaAccountCreated,
        TAG
      ),
    []
  )

  return (
    <Button
      onPress={launchPersonaInquiry}
      text={t('raiseLimitBegin')}
      type={BtnTypes.PRIMARY}
      size={BtnSizes.FULL}
      testID="PersonaButton"
      disabled={!personaAccountCreated || !templateId}
    />
  )
}

export default Persona
