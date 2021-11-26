import createMigrate from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import { _persistConfig } from 'src/redux/store'
import { resetStateOnInvalidStoredAccount } from 'src/utils/accountChecker'
import { getLatestSchema } from 'test/schemas'
import { mocked } from 'ts-jest/utils'

jest.mock('src/redux/createMigrate')
jest.mock('src/utils/accountChecker')

const mockedCreateMigrate = mocked(createMigrate)
const mockedResetStateOnInvalidStoredAccount = mocked(resetStateOnInvalidStoredAccount)

describe('persistConfig', () => {
  it('points to the latest migration', () => {
    const migrationKeys = Object.keys(migrations)
      .map((ver) => parseInt(ver, 10))
      .sort((a, b) => a - b)

    // If this test fails, a migration has been added without increasing the persistConfig version
    expect(_persistConfig.version).toEqual(migrationKeys[migrationKeys.length - 1])
  })

  it('is in sync with the test schema', () => {
    // This is a good practice, we want to keep the test schema in sync with the migrations
    // so we can more easily test them
    expect(_persistConfig.version).toEqual(getLatestSchema()._persist?.version)
  })

  it('migrate calls the expected methods', async () => {
    mockedCreateMigrate.mockReturnValue(() => Promise.resolve({ migrated: true }) as any)
    mockedResetStateOnInvalidStoredAccount.mockImplementation((state) => Promise.resolve(state))
    const state = await _persistConfig.migrate!({} as any, -1)
    expect(state).toEqual({ migrated: true })
    expect(mockedCreateMigrate).toHaveBeenCalledTimes(1)
    expect(mockedResetStateOnInvalidStoredAccount).toHaveBeenCalledTimes(1)
  })
})
