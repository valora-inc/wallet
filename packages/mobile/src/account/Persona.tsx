import pjson from '@celo/mobile/package.json'
import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import * as React from 'react'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import Inquiry, { InquiryAttributes } from 'react-native-persona'
import { useDispatch, useSelector } from 'react-redux'
import { KycStatus } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import networkConfig from 'src/geth/networkConfig'
import { createPersonaAccount, verifyRequiredParams } from 'src/in-house-liquidity'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'PERSONA'

export interface Props {
  kycStatus: KycStatus | undefined
  text?: string | undefined
  onPress?: () => any
  onCancelled?: () => any
  onError?: () => any
  onSuccess?: () => any
}

const Persona = ({ kycStatus, text, onCancelled, onError, onPress, onSuccess }: Props) => {
  const { t } = useTranslation()
  const [personaAccountCreated, setPersonaAccountCreated] = useState(!!kycStatus)

  const walletAddress = useSelector(walletAddressSelector)

  const dispatch = useDispatch()

  const templateIdResponse = useAsync(async () => readOnceFromFirebase('persona/templateId'), [])
  const templateId = templateIdResponse.result

  const launchPersonaInquiry = useCallback(() => {
    if (typeof templateId !== 'string') {
      Logger.error(TAG, `Attempted to initiate Persona with invalid templateId: ${templateId}`)
      return
    }

    if (!walletAddress) {
      // should never happen
      Logger.error(TAG, "Can't render Persona because walletAddress is null")
      return
    }
    onPress?.()
    Inquiry.fromTemplate(templateId)
      .referenceId(walletAddress)
      .environment(networkConfig.personaEnvironment)
      .iosTheme(pjson.persona.iosTheme)
      .onSuccess((inquiryId: string, attributes: InquiryAttributes) => {
        onSuccess?.()
        ValoraAnalytics.track(CICOEvents.persona_kyc_success)
        Logger.info(
          TAG,
          `Inquiry completed for ${inquiryId} with attributes: ${JSON.stringify(attributes)}`
        )
      })
      .onCancelled(() => {
        onCancelled?.()
        ValoraAnalytics.track(CICOEvents.persona_kyc_cancel)
        Logger.info(TAG, 'Inquiry is canceled by the user.')
      })
      .onError((error: Error) => {
        onError?.()
        ValoraAnalytics.track(CICOEvents.persona_kyc_error)
        Logger.error(TAG, `Error: ${error.message}`)
      })
      .build()
      .start()
  }, [templateId])

  useAsync(async () => {
    if (!personaAccountCreated) {
      try {
        await createPersonaAccount({
          ...verifyRequiredParams({ privateKey, publicKey, walletAddress }),
        })
        setPersonaAccountCreated(true)
      } catch (error) {
        Logger.warn(TAG, error)
        dispatch(showError(ErrorMessages.PERSONA_ACCOUNT_ENDPOINT_FAIL))
      }
    }
  }, [])

  return (
    <Button
      onPress={launchPersonaInquiry}
      text={text || t('raiseLimitBegin')}
      type={BtnTypes.PRIMARY}
      size={BtnSizes.MEDIUM}
      testID="PersonaButton"
      disabled={!personaAccountCreated || !templateId}
    />
  )
}

export default Persona
