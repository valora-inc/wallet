import { RemoteConfigValues } from 'src/app/saga'

export const REMOTE_CONFIG_VALUES_DEFAULTS: Omit<
  RemoteConfigValues,
  'fiatAccountSchemaCountryOverrides'
> = {
  inviteRewardsVersion: 'none',
}
