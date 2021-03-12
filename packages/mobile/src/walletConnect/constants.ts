export enum SupportedActions {
  eth_accounts = 'eth_accounts',
  eth_signTransaction = 'eth_signTransaction',
  personal_decrypt = 'personal_decrypt',
  personal_sign = 'personal_sign',
  eth_signTypedData = 'eth_signTypedData',
}

const humanReadableActions: { [action in SupportedActions]: string } = {
  [SupportedActions.eth_accounts]: 'Read your Valora account address',
  [SupportedActions.eth_signTransaction]: 'Send funds',
  [SupportedActions.personal_decrypt]: 'Decrypt data',
  [SupportedActions.personal_sign]: 'Sign payloads',
  [SupportedActions.eth_signTypedData]: 'Sign payloads',
}
export function humanReadableAction(action: SupportedActions): string {
  const value = humanReadableActions[action]
  if (!value) {
    return ''
    // throw new Error('Unsupported action')
  }

  return value
}
