import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import React, { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import DeniedIcon from 'src/icons/DeniedIcon'
import Search from 'src/icons/Search'
import { setSearchQuery } from 'src/map/actions'
import { searchQuerySelector } from 'src/map/selector'
import colors from 'src/styles/colors'

type Props = {
  isInBottomSheet: boolean
}

export default function Searchbar({ isInBottomSheet }: Props) {
  const dispatch = useDispatch()
  const [search, setSearch] = useState<string>(useSelector(searchQuerySelector))

  const handleSearch = (search: string) => {
    setSearch(search)
    dispatch(setSearchQuery(search))
  }

  const handleClearSearch = () => {
    setSearch('')
    dispatch(setSearchQuery(''))
  }

  const textInputProps = {
    autoCapitalize: 'none',
    autoCorrect: false,
    value: search,
    onChangeText: (e: any) => handleSearch(e),
    placeholder: 'Search',
    style: [styles.searchInput],
  }

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <Search />
        {isInBottomSheet ? (
          <BottomSheetTextInput {...(textInputProps as any)} />
        ) : (
          <TextInput {...(textInputProps as any)} />
        )}

        {!!search && (
          <TouchableOpacity onPress={handleClearSearch}>
            <DeniedIcon color={colors.gray3} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 'auto',
  },
  searchBox: {
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: '#F4F4F4',
    padding: 12,
    flexDirection: 'row',
    width: '95%',
  },
  searchInput: { marginLeft: 10, width: '88%', borderRadius: 25 },
})
