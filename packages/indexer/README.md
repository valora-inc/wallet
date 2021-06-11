# Indexer Service

This service is responsible for storing specific events on the Celo
blockchain into a relational database.

## Setup

Install dependencies:

```
yarn
```

## Running locally

Run a local PostgreSQL instance. For example:

```
docker run --rm -p 5432:5432 -e POSTGRES_DB=indexer -e POSTGRES_PASSWORD=docker postgres
```

Start the indexer:

```
yarn start:local
```
