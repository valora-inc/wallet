export const formatVendors = (vendorObject: any) => {
  const vendors = Object.assign(
    {},
    ...vendorObject.data.map((vendor: any) => {
      const title = vendor.attributes?.name
      const logoURI = vendor.attributes?.logo?.data?.attributes?.url
      const tags = vendor.attributes?.tags.map((tag: any) => tag?.tag)
      const siteURI = vendor.attributes?.website
      const location = {
        longitude: vendor.attributes?.longitude,
        latitude: vendor.attributes?.latitude,
      }

      // console.log('LOGO', logoURITest)

      return {
        [vendor.attributes.name]: {
          ...vendor.attributes,
          tags,
          logoURI,
          siteURI,
          location,
          title,
        },
      }
    })
  )

  return vendors
}
