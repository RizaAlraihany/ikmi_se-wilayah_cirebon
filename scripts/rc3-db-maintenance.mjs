import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const EXPECTED = {
  posts: {
    column: 'status',
    enumName: 'PostStatus',
    values: ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'],
  },
  programs: {
    column: 'status',
    enumName: 'ProgramStatus',
    values: ['PLANNED', 'ONGOING', 'COMPLETED'],
  },
  events: {
    column: 'status',
    enumName: 'EventStatus',
    values: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'],
  },
  finance_requests: {
    column: 'status',
    enumName: 'FinanceStatus',
    values: ['PENDING', 'APPROVED_TIER1', 'COMPLETED', 'REJECTED'],
  },
  reports: {
    column: 'status',
    enumName: 'LPJStatus',
    values: ['SUBMITTED', 'VERIFIED_DEPARTMENT', 'VERIFIED_BPH', 'REJECTED'],
  },
  content_plans: {
    column: 'status',
    enumName: 'ContentPlanStatus',
    values: ['PLANNED', 'IN_PROGRESS', 'READY', 'PUBLISHED'],
  },
  notifications: {
    column: 'type',
    enumName: 'NotificationType',
    values: ['REGISTRATION', 'FINANCE', 'POST', 'COMPLAINT', 'LPJ', 'SYSTEM', 'OTHER'],
  },
}

const mode = process.argv[2] ?? 'audit'

async function enumLabels() {
  return prisma.$queryRawUnsafe(`
    select t.typname as enum_name, array_agg(e.enumlabel order by e.enumsortorder) as values
    from pg_type t
    join pg_enum e on e.enumtypid = t.oid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = current_schema()
    group by t.typname
    order by t.typname
  `)
}

async function columnTypes() {
  return prisma.$queryRawUnsafe(`
    select table_name, column_name, udt_name
    from information_schema.columns
    where table_schema = current_schema()
      and (
        (column_name = 'status' and table_name in ('posts', 'programs', 'events', 'finance_requests', 'reports', 'content_plans'))
        or (column_name = 'type' and table_name = 'notifications')
      )
    order by table_name, column_name
  `)
}

async function valueCounts(table, column) {
  return prisma.$queryRawUnsafe(`
    select "${column}"::text as value, count(*)::int as count
    from "${table}"
    group by "${column}"::text
    order by "${column}"::text
  `)
}

async function audit() {
  const [enums, columns] = await Promise.all([enumLabels(), columnTypes()])
  const enumMap = new Map(enums.map((row) => [row.enum_name, row.values]))
  const columnMap = new Map(columns.map((row) => [`${row.table_name}.${row.column_name}`, row.udt_name]))

  const tables = {}
  for (const [table, config] of Object.entries(EXPECTED)) {
    const values = await valueCounts(table, config.column)
    const invalidValues = values
      .filter((row) => !config.values.includes(row.value))
      .map((row) => row.value)

    tables[table] = {
      column: config.column,
      expectedEnum: config.enumName,
      databaseColumnType: columnMap.get(`${table}.${config.column}`) ?? null,
      expectedValues: config.values,
      databaseEnumValues: enumMap.get(config.enumName) ?? null,
      values,
      invalidValues,
      invalidCount: values
        .filter((row) => !config.values.includes(row.value))
        .reduce((sum, row) => sum + row.count, 0),
    }
  }

  return { columns, enums, tables }
}

async function repairContentPlan() {
  const before = await audit()
  const contentBefore = before.tables.content_plans

  if (contentBefore.databaseColumnType !== 'ContentPlanStatus') {
    await prisma.$executeRawUnsafe(`
      do $$
      begin
        if not exists (select 1 from pg_type where typname = 'ContentPlanStatus') then
          create type "ContentPlanStatus" as enum ('PLANNED', 'IN_PROGRESS', 'READY', 'PUBLISHED');
        end if;
      end $$;
    `)

    await prisma.$executeRawUnsafe(`
      alter table "content_plans"
      alter column "status" type "ContentPlanStatus"
      using (
        case "status"::text
          when 'DRAFT' then 'PLANNED'
          when 'PENDING_REVIEW' then 'IN_PROGRESS'
          when 'APPROVED' then 'READY'
          when 'PUBLISHED' then 'PUBLISHED'
          else 'PLANNED'
        end
      )::"ContentPlanStatus"
    `)
  } else if (contentBefore.invalidCount > 0) {
    await prisma.$executeRawUnsafe(`
      update "content_plans"
      set "status" = 'PLANNED'::"ContentPlanStatus"
      where "status"::text = 'DRAFT'
    `)
  }

  const after = await audit()
  const readable = await prisma.contentPlan.findMany({
    select: { id: true, title: true, status: true },
    orderBy: { createdAt: 'asc' },
  })

  return { before: contentBefore, after: after.tables.content_plans, readable }
}

async function repairEnumLabels() {
  await prisma.$executeRawUnsafe(`alter type "PostStatus" add value if not exists 'APPROVED' after 'PENDING_REVIEW'`)
  await prisma.$executeRawUnsafe(`alter type "PostStatus" add value if not exists 'ARCHIVED' after 'PUBLISHED'`)
  await prisma.$executeRawUnsafe(`alter type "AuditAction" add value if not exists 'ARCHIVE' after 'PUBLISH'`)

  return audit()
}

async function schemaAudit() {
  let migrations = []
  let migrationsTableExists = true
  try {
    migrations = await prisma.$queryRawUnsafe(`
      select migration_name, finished_at, rolled_back_at
      from "_prisma_migrations"
      order by started_at
    `)
  } catch (error) {
    if (error?.code !== 'P2010') throw error
    migrationsTableExists = false
  }

  const columns = await prisma.$queryRawUnsafe(`
    select table_name, column_name, data_type, udt_name
    from information_schema.columns
    where table_schema = current_schema()
      and table_name in ('posts', 'content_plans', 'media_assets', 'web_configs', 'notifications')
    order by table_name, ordinal_position
  `)

  const tables = await prisma.$queryRawUnsafe(`
    select table_name
    from information_schema.tables
    where table_schema = current_schema()
      and table_name in ('posts', 'content_plans', 'media_assets', 'web_configs', 'notifications')
    order by table_name
  `)

  const columnSet = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`))
  const required = [
    'posts.excerpt',
    'posts.seo_title',
    'posts.seo_description',
    'posts.seo_keywords',
    'posts.reviewed_by',
    'posts.reviewed_at',
    'posts.published_by',
    'posts.archived_at',
  ]

  return {
    migrationsTableExists,
    migrations,
    tables,
    missingColumns: required.filter((column) => !columnSet.has(column)),
    columns,
  }
}

async function repairSprint5SchemaDrift() {
  const before = await schemaAudit()

  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "excerpt" text`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "seo_title" text`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "seo_description" text`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "seo_keywords" text`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "reviewed_by" text`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "reviewed_at" timestamp(3)`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "published_by" text`)
  await prisma.$executeRawUnsafe(`alter table "posts" add column if not exists "archived_at" timestamp(3)`)

  await prisma.$executeRawUnsafe(`
    create table if not exists "media_assets" (
      "id" text not null,
      "public_id" text not null,
      "url" text not null,
      "secure_url" text not null,
      "filename" text not null,
      "mime_type" text not null,
      "size" integer not null,
      "width" integer,
      "height" integer,
      "folder" text not null,
      "uploaded_by" text not null,
      "created_at" timestamp(3) not null default current_timestamp,
      "updated_at" timestamp(3) not null,
      "deleted_at" timestamp(3),
      "created_by" text,
      "updated_by" text,
      constraint "media_assets_pkey" primary key ("id")
    )
  `)
  await prisma.$executeRawUnsafe(`create unique index if not exists "media_assets_public_id_key" on "media_assets"("public_id")`)
  await prisma.$executeRawUnsafe(`create index if not exists "media_assets_uploaded_by_idx" on "media_assets"("uploaded_by")`)
  await prisma.$executeRawUnsafe(`create index if not exists "media_assets_mime_type_idx" on "media_assets"("mime_type")`)
  await prisma.$executeRawUnsafe(`create index if not exists "media_assets_created_at_idx" on "media_assets"("created_at")`)
  await prisma.$executeRawUnsafe(`
    do $$
    begin
      if not exists (
        select 1 from information_schema.table_constraints
        where constraint_schema = current_schema()
          and table_name = 'media_assets'
          and constraint_name = 'media_assets_uploaded_by_fkey'
      ) then
        alter table "media_assets"
        add constraint "media_assets_uploaded_by_fkey"
        foreign key ("uploaded_by") references "users"("id")
        on delete restrict on update cascade;
      end if;
    end $$;
  `)
  await prisma.$executeRawUnsafe(`create unique index if not exists "categories_name_key" on "categories"("name")`)

  const after = await schemaAudit()
  const postRead = await prisma.post.findMany({ take: 1 })

  return { before, after, postReadCount: postRead.length }
}

try {
  if (mode === 'audit') {
    console.log(JSON.stringify(await audit(), null, 2))
  } else if (mode === 'repair-contentplan') {
    console.log(JSON.stringify(await repairContentPlan(), null, 2))
  } else if (mode === 'repair-enum-labels') {
    console.log(JSON.stringify(await repairEnumLabels(), null, 2))
  } else if (mode === 'schema-audit') {
    console.log(JSON.stringify(await schemaAudit(), null, 2))
  } else if (mode === 'repair-sprint5-schema') {
    console.log(JSON.stringify(await repairSprint5SchemaDrift(), null, 2))
  } else {
    throw new Error(`Unknown mode: ${mode}`)
  }
} finally {
  await prisma.$disconnect()
}
