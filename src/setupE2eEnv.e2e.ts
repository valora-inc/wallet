import Config from 'react-native-config'

// Inject custom e2e config.
// This is done here instead of in the env file
// so we can use any existing env file without having to modify it to run the e2e test
Config.IS_E2E = 'true'
Config.SENTRY_ENABLED = 'false'
