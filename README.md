# Point Pro Backend

express api server with supabase and prisma schema


## Set up environment

```shell
## npm i -g yarn
yarn

# copy local settings
cp .env.example .env

```

## Set up local db

```shell
npx supabase start
npx prisma migrate deploy
npx prisma db seed # add seed data
```

## Set up api server

```shell
yarn dev
```

## Migrations

```shell
# create migration file
npx prisma migrate dev --create-only

# if just wanna create for test,
npx prisma db push

```
## Ref

[supabase](https://supabase.com/docs)
[prisma](https://www.prisma.io/docs/concepts/components/prisma-schema)

