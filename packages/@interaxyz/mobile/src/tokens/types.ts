import { ColorValue } from 'src/styles/colors'

export enum TokenActionName {
  Send = 'Send',
  Swap = 'Swap',
  Add = 'Add',
  Withdraw = 'Withdraw',
  More = 'More',
  Transfer = 'Transfer',
}

export interface TokenAction {
  name: TokenActionName
  title: string
  details: string
  iconComponent: React.MemoExoticComponent<({ color }: { color?: ColorValue }) => JSX.Element>
  onPress: () => void
  visible: boolean
}

export enum AssetTabType {
  Tokens = 0,
  Collectibles = 1,
  Positions = 2,
}
