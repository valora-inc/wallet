import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import LinkArrow from 'src/icons/LinkArrow'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'
import { Vendor } from 'src/vendors/types'

type Props = {
  id: string
  vendor: Vendor
  onPress: () => void
}

export default function VendorListItem({ vendor, id, onPress }: Props) {
  const { title, subtitle, logoURI } = vendor

  const goToVendor = (vendor: Vendor) => {
    const { siteURI } = vendor
    return () => {
      navigateToURI(siteURI)
    }
  }

  return (
    <TouchableOpacity key={id} onPress={onPress} testID={`Vendors/VendorItem`}>
      <View style={styles.vendorItem}>
        <Image source={{ uri: logoURI }} style={styles.vendorIcon} />
        <View style={styles.vendorDetails}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <TouchableOpacity style={styles.vendorLink} onPress={goToVendor(vendor)}>
          <LinkArrow />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  vendorItem: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginVertical: 10,
  },
  vendorIcon: {
    resizeMode: 'contain',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    shadowOffset: { width: 2, height: 2 },
    shadowColor: 'black',
    shadowOpacity: 0.2,
  },
  vendorDetails: {
    flexGrow: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  vendorLink: {
    marginRight: 10,
  },
  title: {
    ...fontStyles.regular,
  },
  subtitle: {
    ...fontStyles.small,
    color: Colors.gray3,
  },
})
