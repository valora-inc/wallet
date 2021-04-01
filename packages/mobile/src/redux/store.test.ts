import { migrations } from 'src/redux/migrations'
import { _persistConfig } from 'src/redux/store'

describe('persistConfig', () => {
  it('points to the latest migration', () => {
    let migrationKeys = Object.keys(migrations)
      .map((ver) => parseInt(ver))
      .sort((a, b) => a - b)

    // If this test fails, a migration has been added without increasing the persistConfig version
    expect(_persistConfig.version).toEqual(migrationKeys[migrationKeys.length - 1])
  })
})
