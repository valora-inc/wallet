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
import { ErrorMessages } from 'src/app/ErrorMessages'
import { readOnceFromFirebase } from 'src/firebase/firebase'
import networkConfig from 'src/geth/networkConfig'
import { createPersonaAccount } from 'src/in-house-liquidity'
import Logger from 'src/utils/Logger'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOEvents } from 'src/analytics/Events'
import { dataEncryptionKeySelector, mtwAddressSelector } from 'src/web3/selectors'

const TAG = 'PERSONA'

export interface Props {
  kycStatus: KycStatus | undefined
  text?: string | undefined
  onPress?: () => any
  onCancelled?: () => any
  onSuccess?: () => any
}

const Persona = ({ kycStatus, text, onCancelled, onPress, onSuccess }: Props) => {
  const { t } = useTranslation()
  const [personaAccountCreated, setPersonaAccountCreated] = useState(!!kycStatus)

  const accountMTWAddress = useSelector(mtwAddressSelector)
  const dekPrivate = useSelector(dataEncryptionKeySelector)

  const dispatch = useDispatch()

  const templateIdResponse = useAsync(async () => readOnceFromFirebase('persona/templateId'), [])
  const templateId = templateIdResponse.result

  const launchPersonaInquiry = useCallback(() => {
    if (typeof templateId !== 'string') {
      Logger.error(TAG, `Attempted to initiate Persona with invalid templateId: ${templateId}`)
      return
    }

    if (!accountMTWAddress) {
      // accountMTWAddress can be null if user's phone number is not verified.
      // Current plan for initial PFP release is to monitor drop off rate for users who haven't verified their phone numbers yet
      // Discussion -> https://valora-app.slack.com/archives/C025V1D6F3J/p1637606953112000
      Logger.error(TAG, "Can't render Persona because accountMTWAddress is null")
      return
    }
    onPress?.()
    Inquiry.fromTemplate(templateId)
      .referenceId(accountMTWAddress)
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
        onCancelled?.()
        ValoraAnalytics.track(CICOEvents.persona_kyc_error)
        Logger.error(TAG, `Error: ${error.message}`)
      })
      .build()
      .start()
  }, [templateId])

  useAsync(async () => {
    if (!personaAccountCreated) {
      if (!accountMTWAddress) {
        Logger.error(TAG, "Can't render Persona because accountMTWAddress is null")
        return
      }

      if (!dekPrivate) {
        Logger.error(TAG, 'Cannot render Persona because dekPrivate is null')
        return
      }

      const IHLResponse = await createPersonaAccount({
        accountMTWAddress,
        dekPrivate,
      })

      if (IHLResponse.status === 201 || IHLResponse.status === 409) {
        setPersonaAccountCreated(true)
      } else {
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
