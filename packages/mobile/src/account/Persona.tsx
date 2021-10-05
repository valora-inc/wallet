import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Inquiry, { InquiryAttributes } from 'react-native-persona'
import { useDispatch } from 'react-redux'
import { KycStatus } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import networkConfig from 'src/geth/networkConfig'
import { Namespaces } from 'src/i18n'
import Logger from 'src/utils/Logger'

const TAG = 'PERSONA'

interface Props {
  kycStatus: KycStatus | undefined
}

const Persona = ({ kycStatus }: Props) => {
  const { t } = useTranslation(Namespaces.accountScreen10)
  const [personaAccountCreated, setPersonaAccountCreated] = useState(!!kycStatus)

  const dispatch = useDispatch()

  const templateIdResponse = useAsync(async () => readOnceFromFirebase('persona/templateId'), [])
  const templateId = templateIdResponse.result

  const launchPersonaInquiry = useCallback(() => {
    if (typeof templateId !== 'string') {
      Logger.error(TAG, `Attempted to initiate Persona with invalid templateId: ${templateId}`)
      return
    }

    Inquiry.fromTemplate(templateId)
      .environment(networkConfig.personaEnvironment)
      .onSuccess((inquiryId: string, attributes: InquiryAttributes) => {
        console.log(`Inquiry completed for ${inquiryId} with attributes: ${attributes}`)
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

  useAsync(async () => {
    if (!personaAccountCreated) {
      const response = await fetch(`${networkConfig.inhouseLiquditiyUrl}/persona/account/create`)
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
