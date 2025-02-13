import { NativeStackScreenProps, StackParamList } from '@divvi/mobile'

type RootStackParamList = StackParamList & {
  Playground: undefined
  CustomScreen: {
    someParam: string
  }
}

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

// This allows type-safe navigation to known and custom screens using the `navigate` function from `@divvi/mobile`
declare global {
  namespace DivviNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
