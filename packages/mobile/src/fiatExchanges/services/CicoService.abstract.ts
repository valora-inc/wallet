export abstract class CicoService {
  abstract getFees(
    cryptoAsset: string,
    fiatAsset: string,
    requestedFiatAmount: number
  ): Promise<{ fee: number }>
}
