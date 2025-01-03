import { createMigrate } from 'src/redux/createMigrate'
import { migrations } from 'src/redux/migrations'
import { _persistConfig } from 'src/redux/store'
import { vNeg1Schema } from 'test/schemas'

const testMigrations = {
  0: jest.fn((state) => ({ ...state, mig0: true })),
  1: jest.fn((state) => ({ ...state, mig1: true })),
  2: jest.fn((state) => ({ ...state, mig2: true })),
  3: jest.fn((state) => ({ ...state, mig3: true })),
}

describe(createMigrate, () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // This ensures all migrations can be run from the initial state
  it(`works for v-1 to v${_persistConfig.version}`, async () => {
    const vNeg1Stub = {
      ...vNeg1Schema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(vNeg1Stub, _persistConfig.version!)
    expect(typeof migratedSchema).toBe('object')
  })

  it(`returns undefined if there's no persisted state`, async () => {
    const migrate = createMigrate(testMigrations)
    const migratedSchema = await migrate(undefined, 0)
    expect(testMigrations[0]).not.toHaveBeenCalled()
    expect(testMigrations[1]).not.toHaveBeenCalled()
    expect(testMigrations[2]).not.toHaveBeenCalled()
    expect(testMigrations[3]).not.toHaveBeenCalled()
    expect(migratedSchema).toBe(undefined)
  })

  // This is what the original createMigrate from redux-persist does,
  // but should we throw instead?
  it(`returns the current state if downgrading`, async () => {
    const v3Stub = {
      _persist: { version: 3, rehydrated: false },
    }

    const migrate = createMigrate(testMigrations)
    const migratedSchema = await migrate(v3Stub, 1)
    expect(testMigrations[0]).not.toHaveBeenCalled()
    expect(testMigrations[1]).not.toHaveBeenCalled()
    expect(testMigrations[2]).not.toHaveBeenCalled()
    expect(testMigrations[3]).not.toHaveBeenCalled()
    expect(migratedSchema).toBe(v3Stub)
  })

  it(`is a no-op if the persisted state version matches the current version`, async () => {
    const v0Stub = {
      _persist: { version: 0, rehydrated: false },
    }

    const migrate = createMigrate(testMigrations)
    const migratedSchema = await migrate(v0Stub, 0)
    expect(testMigrations[0]).not.toHaveBeenCalled()
    expect(testMigrations[1]).not.toHaveBeenCalled()
    expect(testMigrations[2]).not.toHaveBeenCalled()
    expect(testMigrations[3]).not.toHaveBeenCalled()
    expect(migratedSchema).toBe(v0Stub)
  })

  it(`runs only the required migrations`, async () => {
    const v0Stub = {
      _persist: { version: 0, rehydrated: false },
    }

    const migrate = createMigrate(testMigrations)
    const migratedSchema = await migrate(v0Stub, 2)
    expect(testMigrations[0]).not.toHaveBeenCalled()
    expect(testMigrations[1]).toHaveBeenCalled()
    expect(testMigrations[2]).toHaveBeenCalled()
    expect(testMigrations[3]).not.toHaveBeenCalled()
    expect(migratedSchema).toMatchInlineSnapshot(`
      {
        "_persist": {
          "rehydrated": false,
          "version": 0,
        },
        "mig1": true,
        "mig2": true,
      }
    `)
  })

  it(`throws an error if a migration fails`, async () => {
    const vNeg1Stub = {
      ...vNeg1Schema,
      _persist: { version: -1, rehydrated: false },
    }

    const failingMigrations = {
      0: (state: any) => {
        return {
          ...state,
          something: state.something.doesNotExist,
        }
      },
    }

    const migrate = createMigrate(failingMigrations)
    await expect(migrate(vNeg1Stub, 7)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Cannot read properties of undefined (reading 'doesNotExist')"`
    )
  })
})
