export enum SupportedActions {
  eth_accounts = 'eth_accounts',
  eth_signTransaction = 'eth_signTransaction',
  eth_signTypedData = 'eth_signTypedData',
  personal_sign = 'personal_sign',
  personal_decrypt = 'personal_decrypt',
  computeSharedSecret = 'personal_computeSharedSecret',
}

const actionDescriptionTranslations: { [action in SupportedActions]: string } = {
  [SupportedActions.eth_accounts]: 'description.accounts',
  [SupportedActions.eth_signTransaction]: 'description.signTransaction',
  [SupportedActions.eth_signTypedData]: 'description.sign',
  [SupportedActions.personal_sign]: 'description.sign',
  [SupportedActions.personal_decrypt]: 'description.decrypt',
  [SupportedActions.computeSharedSecret]: 'description.computeSharedSecret',
}

const actionTranslations: { [x in SupportedActions]: string } = {
  [SupportedActions.eth_accounts]: 'action.accounts',
  [SupportedActions.eth_signTransaction]: 'action.signTransaction',
  [SupportedActions.eth_signTypedData]: 'action.sign',
  [SupportedActions.personal_sign]: 'action.sign',
  [SupportedActions.personal_decrypt]: 'action.decrypt',
  [SupportedActions.computeSharedSecret]: 'action.computeSharedSecret',
}

export function getTranslationDescriptionFromAction(action: SupportedActions) {
  const translationId = actionDescriptionTranslations[action]
  if (!translationId) {
    throw new Error(`Unsupported action ${action}`)
  }

  return translationId
}

export function getTranslationFromAction(action: SupportedActions) {
  const translationId = actionTranslations[action]
  if (!translationId) {
    throw new Error(`Unsupported action ${action}`)
  }

  return translationId
}
