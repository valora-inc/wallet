import { FlatList, ScrollView } from 'react-native'

module.exports = {
  __esModule: true,
  ...(jest.requireActual('@gorhom/bottom-sheet') as any),
  BottomSheetScrollView: ScrollView,
  BottomSheetFlatList: FlatList,
}
