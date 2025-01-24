export default {
  fromTemplate: jest.fn(() => ({
    referenceId: jest.fn(() => ({
      environment: jest.fn(() => ({
        iosTheme: jest.fn(() => ({
          onSuccess: jest.fn(() => ({
            onCancelled: jest.fn(() => ({
              onError: jest.fn(() => ({
                build: jest.fn(() => ({
                  start: jest.fn(),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
}

export enum Environment {
  SANDBOX = 'sandbox',
  PRODUCTION = 'production',
}
