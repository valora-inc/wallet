// eslint-disable-next-line max-classes-per-file
// @ts-ignore
import EllipticSignature from 'elliptic/lib/elliptic/ec/signature'

export abstract class SessionStorage {
  protected userId: string

  // returns public key and generates pair (if needed)
  public abstract getPublicKey(): Promise<string>

  public abstract signChallenge(message: string): Promise<Signature>

  public constructor(userId: string) {
    this.userId = userId
  }
}

export interface Signature {
  r: string
  s: string
  recoveryParam: number
}
