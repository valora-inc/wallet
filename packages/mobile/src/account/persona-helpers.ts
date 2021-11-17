import { Dispatch } from 'redux'
import * as React from 'react'
import Logger from '../utils/Logger'
import { serializeSignature, signMessage } from '@celo/utils/lib/signatureUtils'
import networkConfig from '../geth/networkConfig'
import { showError } from '../alert/actions'
import { ErrorMessages } from '../app/ErrorMessages'

export async function createAccount(
  getPrivateKey: () => Promise<string>,
  dispatch: Dispatch,
  personaAccountCreated: boolean,
  accountAddress: string | null,
  setPersonaAccountCreated: React.Dispatch<React.SetStateAction<boolean>>,
  tag: string
) {
  if (!personaAccountCreated) {
    if (!accountAddress) {
      Logger.error(tag, "Can't render Persona because accountAddress is null")
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
}
