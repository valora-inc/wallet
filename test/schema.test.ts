import Ajv from 'ajv'
import { getLatestSchema } from 'test/schemas'

describe(getLatestSchema, () => {
  // TypeScript already ensures the latest test schema is compatible with RootState
  // but it doesn't find missing root properties and different enum values
  // The RootStateSchema allows checking that at runtime
  // See https://github.com/valora-inc/wallet/tree/main/WALLET.md#redux-state-migration
  it('validates against the RootState schema', async () => {
    const data = getLatestSchema()

    const ajv = new Ajv({ allErrors: true, allowUnionTypes: true })
    const schema = require('./RootStateSchema.json')
    const validate = ajv.compile(schema)
    const isValid = validate(data)

    // console.log('Validation errors:', validate.errors?.length, validate.errors)
    expect(validate.errors).toBeNull()
    expect(isValid).toBe(true)
  })
})
