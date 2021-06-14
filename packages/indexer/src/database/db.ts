import { Knex, knex } from 'knex'

export let db: Knex
export async function initDatabase() {
  if (process.env.DB_TYPE === 'sqlite') {
    db = knex({
      client: 'sqlite',
      connection: {
        filename: ':memory:',
      },
      useNullAsDefault: true,
    })
  } else {
    db = knex({
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

  await db.migrate.latest({
    directory: './dist/migrations',
    loadExtensions: ['.js'],
  })

  console.info('Database initialized successfully')
  return db
}

export function database(tableName: string) {
  if (!db) {
    throw new Error('Database not yet initialized')
  }

  return db(tableName)
}
