import { Address } from '@celo/base/lib/address'
import ENS from '@ensdomains/ensjs'
import { NameResolutionResults, NameResolver, ResolutionKind } from '@valora/resolve-kit'
import { normalize } from 'eth-ens-namehash'
import { providers } from 'ethers'

const NullNomResolution = '0x0000000000000000000000000000000000000000'

export async function getAddress(name: string) {
  console.log(`DIEGO local: ${name}`)
  const resolveNom = new LocalResolveNom({
    providerUrl: 'https://alfajores-forno.celo-testnet.org/',
    ensRegistryAddress: LocalResolveNom.AlfajoresENSRegsitryAddress,
  })
  return await resolveNom.resolve(name)
}

export class LocalResolveNom implements NameResolver {
  static readonly AlfajoresENSRegsitryAddress: Address =
    '0x40cd4db228e9c172dA64513D0e874d009486A9a9'
  static readonly MainnetENSRegsitryAddress: Address = '0x3DE51c3960400A0F752d3492652Ae4A0b2A36FB3'

  private ens: any

  constructor({
    providerUrl,
    ensRegistryAddress,
    ens,
  }: {
    providerUrl?: string
    ensRegistryAddress?: Address
    ens?: any
  }) {
    if (ens) {
      this.ens = ens
    } else if (providerUrl && ensRegistryAddress) {
      const provider = new providers.JsonRpcProvider(providerUrl)
      console.log(`DIEGO INIT: ${providerUrl} ${ensRegistryAddress}`)
      this.ens = new ENS({ provider, ensAddress: ensRegistryAddress })
    } else {
      throw new Error('Missing kit and contractAddress')
    }
  }

  async resolve(id: string): Promise<NameResolutionResults> {
    console.log(`DIEGO resolve: ${id}`)
    if (!id.endsWith('.nom')) {
      return {
        resolutions: [],
        errors: [],
      }
    }
    const name = id.substring(0, id.length - '.nom'.length)

    //
    // https://docs.nom.space/dapp-developers/integrating-.nom-into-your-dapp
    //
    const normalName = normalize(name)
    const ensName = this.ens.name(`${normalName}.nom`)
    try {
      console.log(`DIEGO before ${normalName}`)
      const address = await ensName.getAddress()
      console.log(`DIEGO after ${address}`)
      if (address !== NullNomResolution) {
        return {
          resolutions: [
            {
              kind: ResolutionKind.Nom,
              address,
              name,
            },
          ],
          errors: [],
        }
      }
    } catch (error) {
      return {
        resolutions: [],
        errors: [
          {
            kind: ResolutionKind.Nom,
            error: error as Error,
          },
        ],
      }
    }

    return {
      resolutions: [],
      errors: [],
    }
  }
}
