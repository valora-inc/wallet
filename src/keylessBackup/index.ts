import { SiweClient } from '@fiatconnect/fiatconnect-sdk'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { KeylessBackupEvents } from 'src/analytics/Events'
import { getWalletAddressFromPrivateKey } from 'src/keylessBackup/encryption'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import { Network } from 'src/transactions/types'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import networkConfig from 'src/web3/networkConfig'
import { Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const SIWE_STATEMENT = 'Sign in with Ethereum'
const SIWE_VERSION = '1'
const SESSION_DURATION_MS = 5 * 60 * 1000 // 5 mins

export async function storeEncryptedMnemonic({
  encryptedMnemonic,
  encryptionAddress,
  jwt,
}: {
  encryptedMnemonic: string
  encryptionAddress: string
  jwt: string
}) {
  const response = await fetchWithTimeout(networkConfig.cabStoreEncryptedMnemonicUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encryptedMnemonic,
      encryptionAddress,
      token: jwt,
    }),
  })
  if (!response.ok) {
    AppAnalytics.track(KeylessBackupEvents.cab_post_encrypted_mnemonic_failed, {
      backupAlreadyExists: response.status === 409,
    })
    const message = (await response.json())?.message
    throw new Error(
      `Failed to post encrypted mnemonic with status ${response.status}, message ${message}`
    )
  }
}

function getSIWEClient(privateKey: Hex) {
  const account = privateKeyToAccount(privateKey)
  const accountAddress = getWalletAddressFromPrivateKey(privateKey)
  return new SiweClient(
    {
      accountAddress,
      statement: SIWE_STATEMENT,
      version: SIWE_VERSION,
      chainId: networkConfig.viemChain[Network.Celo].id,
      sessionDurationMs: SESSION_DURATION_MS,
      loginUrl: networkConfig.cabLoginUrl,
      clockUrl: networkConfig.cabClockUrl,
      timeout:
        getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.WALLET_NETWORK_TIMEOUT_SECONDS])
          .default * 1000,
    },
    (message) => account.signMessage({ message })
  )
}

export async function getEncryptedMnemonic(encryptionPrivateKey: Hex) {
  const siweClient = getSIWEClient(encryptionPrivateKey)
  await siweClient.login()
  const response = await siweClient.fetch(networkConfig.cabGetEncryptedMnemonicUrl)
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    const message = (await response.json())?.message
    throw new Error(
      `Failed to get encrypted mnemonic with status ${response.status}, message ${message}`
    )
  }
  const { encryptedMnemonic } = (await response.json()) as { encryptedMnemonic: string }
  return encryptedMnemonic
}

export async function deleteEncryptedMnemonic(encryptionPrivateKey: Hex) {
  const siweClient = getSIWEClient(encryptionPrivateKey)
  await siweClient.login()
  const response = await siweClient.fetch(networkConfig.cabDeleteEncryptedMnemonicUrl, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const message = (await response.json())?.message
    throw new Error(
      `Failed to delete encrypted mnemonic with status ${response.status}, message ${message}`
    )
  }
}
