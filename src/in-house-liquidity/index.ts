import { getClient } from 'src/in-house-liquidity/client'
import networkConfig from 'src/web3/networkConfig'

interface RequiredParams {
  walletAddress: string
}

/**
 * Create a Persona account for the given accountMTWAddress
 *
 *
 * @param {params.walletAddress} walletAddress
 */
export const createPersonaAccount = async ({ walletAddress }: RequiredParams): Promise<void> => {
  const body = { accountAddress: walletAddress }
  const ihlClient = await getClient()
  const response = await ihlClient.fetch(
    `${networkConfig.inHouseLiquidityURL}/persona/account/create`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  )
  if (response.status !== 201 && response.status !== 409) {
    throw new Error(`IHL /persona/account/create failure status ${response.status}`)
  }
}

// just checks that the wallet address is non null for now. keeping this since we may want it to do more once
//  the new auth scheme is figured out (like checking if a wallet is unlocked or a token is truthy)
export const verifyWalletAddress = ({
  walletAddress,
}: {
  walletAddress: string | null
}): RequiredParams => {
  if (!walletAddress) {
    throw new Error('Cannot call IHL because walletAddress is null')
  }

  return {
    walletAddress: walletAddress,
  }
}
