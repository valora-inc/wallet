import { RemoteConfigValues } from 'src/app/saga'
import { isE2EEnv } from 'src/config'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  'fiatAccountSchemaCountryOverrides'
> = {
  inviteRewardsVersion: 'none',
  fiatConnectCashInEnabled: false,
  fiatConnectCashOutEnabled: isE2EEnv ? true : false,
}
