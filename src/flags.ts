// Country specific features, unlisted countries are set to `false` by default
// Using 2 letters alpha code. See https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
export const countryFeatures = {
  RESTRICTED_CP_DOTO: {
    JP: true, // Japan
    PH: true, // Philippines
  },
  SANCTIONED_COUNTRY: {
    IR: true, // Iran
    CU: true, // Cuba
    KP: true, // North Korea
    SD: true, // Sudan
    SY: true, // Syria
  },
  IS_IN_EUROPE: {
    // Countries in Europe, taken from https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_in_Europe
    AD: true, // Andorra
    AL: true, // Albania
    AM: true, // Armenia
    AT: true, // Austria
    AZ: true, // Azerbaijan
    BA: true, // Bosnia and Herzegovina
    BE: true, // Belgium
    BG: true, // Bulgaria
    BY: true, // Belarus
    CH: true, // Switzerland
    CY: true, // Cyprus
    CZ: true, // Czech Republic
    DE: true, // Germany
    DK: true, // Denmark
    EE: true, // Estonia
    ES: true, // Spain
    FI: true, // Finland
    FO: true, // Faroe Islands
    FR: true, // France
    GB: true, // United Kingdom
    GE: true, // Georgia
    GG: true, // Guernsey
    GI: true, // Gibraltar
    GR: true, // Greece
    HR: true, // Croatia
    HU: true, // Hungary
    IE: true, // Ireland
    IM: true, // Isle of Man
    IS: true, // Iceland
    IT: true, // Italy
    JE: true, // Jersey
    KZ: true, // Kazakhstan
    LI: true, // Liechtenstein
    LT: true, // Lithuania
    LU: true, // Luxembourg
    LV: true, // Latvia
    MC: true, // Monaco
    MD: true, // Moldova
    ME: true, // Montenegro
    MK: true, // North Macedonia
    MT: true, // Malta
    NL: true, // Netherlands
    NO: true, // Norway
    PL: true, // Poland
    PT: true, // Portugal
    RO: true, // Romania
    RS: true, // Serbia
    RU: true, // Russia
    SE: true, // Sweden
    SI: true, // Slovenia
    SJ: true, // Svalbard
    SK: true, // Slovakia
    SM: true, // San Marino
    TR: true, // Turkey
    UA: true, // Ukraine
    VA: true, // Vatican
    XI: true, // Northern Ireland
    XK: true, // Kosovo
  },
}
