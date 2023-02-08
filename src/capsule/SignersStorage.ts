export abstract class SignersStorage {
  public abstract addAccount(account: string): Promise<void>
  public abstract getAccounts(): Promise<string[]>
}
