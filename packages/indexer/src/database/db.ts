import { Knex, knex } from 'knex'

export let database: Knex
export async function initDatabase() {
  if (process.env.DB_TYPE === 'sqlite') {
    database = knex({
      client: 'sqlite',
      connection: {
        filename: ':memory:',
      },
      useNullAsDefault: true,
    })
  } else {
    database = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST ?? 'localhost',
        database: process.env.DB_DATABASE ?? 'indexer',
        user: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'docker',
      },
      debug: false, // TODO: Read this from env variable
    })
  }

  console.info('Running Migrations')

  await database.migrate.latest({
    directory: './dist/migrations',
    loadExtensions: ['.js'],
  })

  console.info('Database initialized successfully')
  return database
}
