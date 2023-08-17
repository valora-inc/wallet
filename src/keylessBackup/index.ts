import networkConfig from 'src/web3/networkConfig'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'

export async function storeEncryptedMnemonic({
  encryptedMnemonic,
  encryptionAddress,
}: {
  encryptedMnemonic: string
  encryptionAddress: string
}) {
  const response = await fetchWithTimeout(networkConfig.cabStoreEncryptedMnemonicUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encryptedMnemonic,
      encryptionAddress,
    }),
  })
  if (!response.ok) {
    ValoraAnalytics.track(KeylessBackupEvents.cab_post_encrypted_mnemonic_failed, {
      backupAlreadyExists: response.status === 409,
    })
    const message = (await response.json())?.message
    throw new Error(
      `Failed to post encrypted mnemonic with status ${response.status}, message ${message}`
    )
  }
}
