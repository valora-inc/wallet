export enum Actions {
  ADD_IMPORT_TOKEN_ID = 'TOKENS/ADD_IMPORT_TOKEN_ID',
  REMOVE_IMPORT_TOKEN_ID = 'TOKENS/REMOVE_IMPORT_TOKEN_ID',
}

export interface AddImportTokenIdAction {
  type: Actions.ADD_IMPORT_TOKEN_ID
  tokenId: string
}

export interface RemoveImportTokenIdAction {
  type: Actions.REMOVE_IMPORT_TOKEN_ID
  tokenId: string
}

export const addImportTokenId = (tokenId: string): AddImportTokenIdAction => ({
  type: Actions.ADD_IMPORT_TOKEN_ID,
  tokenId,
})

export const removeImportTokenId = (tokenId: string): RemoveImportTokenIdAction => ({
  type: Actions.REMOVE_IMPORT_TOKEN_ID,
  tokenId,
})
