import React, { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import DeniedIcon from 'src/icons/DeniedIcon'
import Search from 'src/icons/Search'
import { setSearchQuery } from 'src/map/actions'
import { searchQuerySelector } from 'src/map/selector'

export default function Searchbar() {
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

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchBox}>
        <Search />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          value={search}
          onChangeText={(e) => handleSearch(e)}
          placeholder="Search"
          style={styles.searchInput}
        />
        {!!search && (
          <TouchableOpacity onPress={handleClearSearch}>
            <DeniedIcon />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    width: 'auto',
    borderWidth: 1,
    borderColor: '#EDEDED',
    borderRadius: 25,
  },
  searchBox: {
    display: 'flex',
    borderRadius: 25,
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    flexDirection: 'row',
    width: '100%',
  },
  searchInput: { marginLeft: 10, width: '88%', borderRadius: 25 },
})
