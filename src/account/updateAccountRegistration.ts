import networkConfig from 'src/web3/networkConfig'
import { Address } from 'viem'

export interface RegistrationProperties {
  language?: string | null
  country?: string
  appVersion?: string
  fcmToken?: string
}

export async function updateAccountRegistration(
  address: Address | null,
  signature: string | null,
  properties: RegistrationProperties
): Promise<void> {
  if (!signature || !address) {
    throw new Error('Missing address or signed message')
  }

  const response = await fetch(networkConfig.setRegistrationPropertiesUrl, {
    method: 'POST',
    headers: {
      'content-Type': 'application/json',
      authorization: `Valora ${address}:${signature}`,
    },
    body: JSON.stringify({ ...properties, address }),
  })

  if (!response.ok) {
    throw new Error(
      `Update registration properties failed with status ${
        response.status
      }, text: ${await response.text()}`
    )
  }
}
