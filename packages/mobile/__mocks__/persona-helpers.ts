import { Dispatch } from 'redux'
import * as React from 'react'

export async function createAccount(
  getPrivateKey: () => Promise<string>,
  dispatch: Dispatch,
  personaAccountCreated: boolean,
  accountAddress: string | null,
  setPersonaAccountCreated: React.Dispatch<React.SetStateAction<boolean>>,
  tag: string
) {
  // yawn
}
