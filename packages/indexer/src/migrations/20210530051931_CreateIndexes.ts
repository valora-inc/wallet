import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('escrow', (table) => {
    table.index('from')
  })
  await knex.schema.alterTable('transfers', (table) => {
    table.index('from')
    table.index('to')
  })
  await knex.schema.alterTable('attestations_completed', (table) => {
    table.index('account')
    table.index('identifier')
  })
  await knex.schema.alterTable('account_wallet_mappings', (table) => {
    table.index('walletAddress')
  })
}

export async function down(knex: Knex): Promise<void> {}
