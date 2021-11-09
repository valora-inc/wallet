import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import { generateKeys } from '@celo/utils/lib/account'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import * as React from 'react'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Inquiry, { InquiryAttributes } from 'react-native-persona'
import { useDispatch, useSelector } from 'react-redux'
import { KycStatus } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getStoredMnemonic } from 'src/backup/utils'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import networkConfig from 'src/geth/networkConfig'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'
import { accountAddressSelector } from 'src/web3/selectors'

const TAG = 'PERSONA'

interface Props {
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
        console.log(
          `Inquiry completed for ${inquiryId} with attributes: ${JSON.stringify(attributes)}`
        )
      })
      .onCancelled(() => {
        console.log('Inquiry #{inquiryId} canceled.')
      })
      .onError((error: Error) => {
        console.error(`Error: ${error.message}`)
      })
      .build()
      .start()
  }, [templateId])

  const getPrivateKey = async (): Promise<string> => {
    debugger
    const mnemonic = await getStoredMnemonic(accountAddress)
    if (!mnemonic) {
      throw new Error('Unable to fetch mnemonic from the store')
    }

    const keys = await generateKeys(mnemonic)
    return keys?.privateKey
  }

  useAsync(async () => {
    if (!personaAccountCreated) {
      if (!accountAddress) {
        // TODO: Lisa - Is this the right pattern for forcing accountAddress to be not null?
        Logger.error(TAG, "Can't render Persona because accountAddress is null")
        return
      }

      const privateKey = await getPrivateKey()
      const signature = signMessage(
        `post /account/create ${JSON.stringify({ accountAddress })}`,
        privateKey,
        accountAddress
      )
      const serializedSignature = serializeSignature(signature)

      const response = await fetch(`${networkConfig.inhouseLiquditiyUrl}/persona/account/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Valora ${accountAddress}:${serializedSignature}`,
        },
        body: JSON.stringify({ accountAddress }),
      })

      if (response.status === 201 || response.status === 409) {
        setPersonaAccountCreated(true)
      } else {
        dispatch(showError(ErrorMessages.PERSONA_ACCOUNT_ENDPOINT_FAIL))
      }
    }
  }, [])

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
