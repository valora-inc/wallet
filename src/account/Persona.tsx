import * as React from 'react'
import { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Fields, Inquiry } from 'react-native-persona'
import { KycStatus } from 'src/account/reducer'
import { showError } from 'src/alert/actions'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { getPersonaTemplateId } from 'src/firebase/firebase'
import { createPersonaAccount, verifyWalletAddress } from 'src/in-house-liquidity'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
// eslint-disable-next-line import/no-relative-packages
import pjson from '../../package.json'

const TAG = 'PERSONA'

export interface Props {
  kycStatus: KycStatus | undefined
  disabled: boolean
  text?: string | undefined
  onPress?: () => any
  onCanceled?: () => any
  onError?: () => any
  onSuccess?: () => any
}

enum Status {
  completed = 'completed',
  failed = 'failed',
}

const Persona = ({ kycStatus, text, onCanceled, onError, onPress, onSuccess, disabled }: Props) => {
  const { t } = useTranslation()
  const [personaAccountCreated, setPersonaAccountCreated] = useState(
    kycStatus !== undefined && kycStatus !== KycStatus.NotCreated
  )

  const walletAddress = useSelector(walletAddressSelector)

  const dispatch = useDispatch()

  const templateIdResponse = useAsync(async () => getPersonaTemplateId(), [])
  const templateId = templateIdResponse.result

  const launchPersonaInquiry = useCallback(() => {
    if (typeof templateId !== 'string') {
      Logger.error(TAG, `Attempted to initiate Persona with invalid templateId: ${templateId}`)
      return
    }

    if (!walletAddress) {
      Logger.warn(TAG, "Can't render Persona because walletAddress is null")
      return
    }
    onPress?.()
    Inquiry.fromTemplate(templateId)
      .referenceId(walletAddress)
      .environment(networkConfig.personaEnvironment)
      .iosTheme(pjson.persona.iosTheme)
      .onComplete((inquiryId: string, status: string, _fields: Fields) => {
        if (status === Status.failed) {
          onError?.()
          ValoraAnalytics.track(CICOEvents.persona_kyc_failed)
          Logger.error(TAG, `Inquiry failed for ${inquiryId}`)
        } else {
          onSuccess?.()
          ValoraAnalytics.track(CICOEvents.persona_kyc_success)
          Logger.info(TAG, `Inquiry completed for ${inquiryId}`)
        }
      })
      .onCanceled(() => {
        onCanceled?.()
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
        await createPersonaAccount(verifyWalletAddress({ walletAddress }))
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
      disabled={!personaAccountCreated || !templateId || disabled}
    />
  )
}

export default Persona
