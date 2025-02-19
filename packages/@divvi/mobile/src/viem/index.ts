import {
  ALCHEMY_ARBITRUM_API_KEY,
  ALCHEMY_BASE_API_KEY,
  ALCHEMY_ETHEREUM_API_KEY,
  ALCHEMY_OPTIMISM_API_KEY,
  ALCHEMY_POLYGON_POS_API_KEY,
} from 'src/config'
import { Network } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { PublicClient, Transport, createPublicClient, http } from 'viem'

export const INTERNAL_RPC_SUPPORTED_NETWORKS = [Network.Arbitrum] as const

export const viemTransports: Record<Network, Transport> = {
  [Network.Celo]: http(),
  [Network.Ethereum]: http(networkConfig.alchemyRpcUrl[Network.Ethereum], {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ALCHEMY_ETHEREUM_API_KEY}`,
      },
    },
  }),
  [Network.Arbitrum]: http(networkConfig.alchemyRpcUrl[Network.Arbitrum], {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ALCHEMY_ARBITRUM_API_KEY}`,
      },
    },
  }),
  [Network.Optimism]: http(networkConfig.alchemyRpcUrl[Network.Optimism], {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ALCHEMY_OPTIMISM_API_KEY}`,
      },
    },
  }),
  [Network.PolygonPoS]: http(networkConfig.alchemyRpcUrl[Network.PolygonPoS], {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ALCHEMY_POLYGON_POS_API_KEY}`,
      },
    },
  }),
  [Network.Base]: http(networkConfig.alchemyRpcUrl[Network.Base], {
    fetchOptions: {
      headers: {
        Authorization: `Bearer ${ALCHEMY_BASE_API_KEY}`,
      },
    },
  }),
}

export const appViemTransports = {
  [Network.Arbitrum]: http(networkConfig.internalRpcUrl.arbitrum),
} satisfies Record<(typeof INTERNAL_RPC_SUPPORTED_NETWORKS)[number], Transport>

export type StaticPublicClient = typeof publicClient
const defaultPublicClientParams = {
  // This enables call batching via multicall
  // meaning client.call, client.readContract, etc. will batch calls (using multicall)
  // when the promises are scheduled in the same event loop tick (or within `wait` ms)
  // for instance when Promise.all is used
  // Note: directly calling multiple client.multicall won't batch, they are sent separately
  // See https://viem.sh/docs/clients/public.html#eth_call-aggregation-via-multicall
  batch: {
    multicall: {
      wait: 0,
    },
  },
}

export const publicClient = {
  [Network.Celo]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain.celo,
    transport: viemTransports[Network.Celo],
  }),
  [Network.Ethereum]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain.ethereum,
    transport: viemTransports[Network.Ethereum],
  }),
  [Network.Arbitrum]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain.arbitrum,
    transport: viemTransports[Network.Arbitrum],
  }),
  [Network.Optimism]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain.optimism,
    transport: viemTransports[Network.Optimism],
  }),
  [Network.PolygonPoS]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain['polygon-pos'],
    transport: viemTransports[Network.PolygonPoS],
  }),
  [Network.Base]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain.base,
    transport: viemTransports[Network.Base],
  }),
}

export const appPublicClient = {
  [Network.Arbitrum]: createPublicClient({
    ...defaultPublicClientParams,
    chain: networkConfig.viemChain.arbitrum,
    transport: appViemTransports[Network.Arbitrum],
  }),
} satisfies Record<(typeof INTERNAL_RPC_SUPPORTED_NETWORKS)[number], PublicClient>
