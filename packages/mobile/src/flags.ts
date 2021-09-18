// Feature flags
export const features = {
  USE_COMMENT_ENCRYPTION: true,
  DATA_SAVER: true,
  PHONE_NUM_METADATA_IN_TRANSFERS: true,
  VERIFICATION_FORNO_RETRY: true,
  SHOW_CASH_OUT: true,
  PNP_USE_DEK_FOR_AUTH: true,
  SHOW_INVITE_MENU_ITEM: false,
}

// Country specific features, unlisted countries are set to `false` by default
// Using 2 letters alpha code. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
export const countryFeatures = {
  RESTRICTED_CP_DOTO: {
    JP: true,
    PH: true,
  },
  SANCTIONED_COUNTRY: {
    IR: true,
    CU: true,
    KP: true,
    SD: true,
    SY: true,
  },
  FIAT_SPEND_ENABLED: {
    PH: true,
  },
}
