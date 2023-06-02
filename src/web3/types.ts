export interface KeychainAccount {
  address: string
  createdAt: Date
  importFromMnemonic?: boolean
}

export interface ImportMnemonicAccount {
  address: string | null
  createdAt: Date
}
