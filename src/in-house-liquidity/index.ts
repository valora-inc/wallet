import networkConfig from 'src/web3/networkConfig'

interface RequiredParams {
  walletAddress: string
}

interface SignAndFetchParams {
  path: string
  walletAddress: string
  requestOptions: RequestInit
}

/**
 * Create a Persona account for the given accountMTWAddress
 *
 *
 * @param {params.walletAddress} walletAddress
 */
export const createPersonaAccount = async ({ walletAddress }: RequiredParams): Promise<void> => {
  const body = { accountAddress: walletAddress }
  const response = await signAndFetch({
    path: '/persona/account/create',
    walletAddress,
    requestOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  })
  if (response.status !== 201 && response.status !== 409) {
    throw new Error(`IHL /persona/account/create failure status ${response.status}`)
  }
}

/**
 * A fetch wrapper that adds in the signature needed for IHL authorization
 *
 *
 * @param {params.path} string like /persona/get/foo
 * @param {params.requestOptions} requestOptions all the normal fetch options
 * @returns {Response} response object from the fetch call
 */
export const signAndFetch = async ({
  path,
  requestOptions,
}: SignAndFetchParams): Promise<Response> => {
  return fetch(`${networkConfig.inHouseLiquidityURL}${path}`, {
    ...requestOptions,
    headers: {
      ...requestOptions.headers,
      // Authorization: authHeader, // todo add this once auth scheme is refactored
    },
  })
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
