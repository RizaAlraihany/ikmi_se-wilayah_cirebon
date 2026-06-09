# RC3 ContentPlan Repair

Date: 2026-06-10

## Problem

Connected database had one legacy ContentPlan record with:

```text
status = DRAFT
```

The current Prisma schema accepts only:

```text
PLANNED
IN_PROGRESS
READY
PUBLISHED
```

## Audit Result

Before repair:

```json
{
  "databaseColumnType": "PostStatus",
  "values": [{ "value": "DRAFT", "count": 1 }],
  "invalidCount": 1
}
```

## Repair Mapping

```text
DRAFT -> PLANNED
```

Because the database column itself still used the wrong enum type, the repair also aligned:

```text
content_plans.status: PostStatus -> ContentPlanStatus
```

## Validation

After repair:

```json
{
  "databaseColumnType": "ContentPlanStatus",
  "values": [{ "value": "PLANNED", "count": 1 }],
  "invalidCount": 0
}
```

Prisma read validation:

```json
[
  {
    "id": "cp_komdigi_1",
    "title": "Launching Web",
    "status": "PLANNED"
  }
]
```

## Status

ContentPlan repaired: PASS.

