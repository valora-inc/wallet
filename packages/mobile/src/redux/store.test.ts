import { migrations } from 'src/redux/migrations'
import { _persistConfig } from 'src/redux/store'
import { getLatestSchema } from 'test/schemas'

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
})
