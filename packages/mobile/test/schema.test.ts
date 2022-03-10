import Ajv from 'ajv'
import { getLatestSchema } from 'test/schemas'

describe(getLatestSchema, () => {
  // TypeScript already ensures the latest test schema is compatible with RootState
  // but it doesn't find missing root properties and different enum values
  // The RootStateSchema allows checking that at runtime
  it('validates against the RootState schema', async () => {
    const ajv = new Ajv({ allErrors: true })
    const schema = require('./RootStateSchema.json')

    const data = getLatestSchema()

    const validate = ajv.compile(schema)
    const valid = validate(data)
    console.log('==valid', valid, validate.errors?.length)
    console.log(validate.errors)

    expect(validate.errors).toBeNull()
    expect(valid).toBe(true)
  })
})
