export enum Actions {
  SET_ACCOUNT = 'WEB3/SET_ACCOUNT',
  DEMO_MODE_TOGGLED = 'WEB3/DEMO_MODE_TOGGLED',
}

export interface SetAccountAction {
  type: Actions.SET_ACCOUNT
  address: string
}

interface DemoModeToggled {
  type: Actions.DEMO_MODE_TOGGLED
  enabled: boolean
}

export type ActionTypes = SetAccountAction | DemoModeToggled

export const setAccount = (address: string): SetAccountAction => {
  return {
    type: Actions.SET_ACCOUNT,
    address: address.toLowerCase(),
  }
}

export const demoModeToggled = (enabled: boolean): DemoModeToggled => {
  return {
    type: Actions.DEMO_MODE_TOGGLED,
    enabled,
  }
}
