import { ReactNativeSignersStorage } from '@usecapsule/react-native-wallet'

export class ZedSignerStorage extends ReactNativeSignersStorage {
  public async addAccount(account: string): Promise<void> {
    await super.addAccount(account)
    // @todo Store account in redux
  }

  public async getAccounts(): Promise<string[]> {
    // @todo Retrieve accounts from redux
    return await super.getAccounts()
  }
}
