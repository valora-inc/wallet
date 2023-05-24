const IPFSGatewayTools = require('@pinata/ipfs-gateway-tools/dist/node')
const { convertToDesiredGateway, containsCID } = new IPFSGatewayTools()

// TODO: replace with Statsig flag
const USE_DEDICATED_GATEWAY = false

function convertToCloudflareGateway(url: string) {
  if (url?.startsWith('ipfs://')) {
    return `https://cloudflare-ipfs.com/ipfs/${url.substring('ipfs://'.length)}`
  }
  if (url?.startsWith('https://ipfs.io/ipfs/')) {
    return `https://cloudflare-ipfs.com/ipfs/${url.substring('https://ipfs.io/ipfs/'.length)}`
  }
  if (url?.startsWith('https://gateway.pinata.cloud/ipfs/')) {
    return `https://cloudflare-ipfs.com/ipfs/${url.substring(
      'https://gateway.pinata.cloud/ipfs/'.length
    )}`
  }
  return url
}

export function handleNftUrl(url: string | undefined) {
  if (!url) {
    return url
  }

  if (USE_DEDICATED_GATEWAY && containsCID(url).containsCid) {
    return convertToDedicatedGateway(url)
  } else {
    return convertToCloudflareGateway(url)
  }
}

function convertToDedicatedGateway(image: string) {
  try {
    return convertToDesiredGateway(image, 'https://valoranfts.mypinata.cloud')
  } catch (e) {
    return image ?? ''
  }
}
