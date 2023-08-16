import networkConfig from 'src/web3/networkConfig'
import Logger from 'src/utils/Logger'

const TAG = 'src/keylessBackup/index.ts'

export async function storeEncryptedMnemonic({
  encryptedMnemonic,
  encryptionAddress,
}: {
  encryptedMnemonic: string
  encryptionAddress: string
}) {
  const response = await fetch(networkConfig.cabStoreEncryptedMnemonicUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encryptedMnemonic,
      encryptionAddress,
    }),
  })
  if (response.status === 409) {
    Logger.info(TAG, 'Encrypted mnemonic already exists')
  } else if (!response.ok) {
    throw new Error(`Failed to post encrypted mnemonic: ${response.status}`)
  }
}
