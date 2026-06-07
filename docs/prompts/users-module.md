Implement Users Module.

Read:

- AGENT.md
- 03-RBAC-MATRIX.md
- 04-FSD.md
- 05-DATABASE-DICTIONARY.md
- 06-PRISMA-SCHEMA-STANDARD.md

Scope:

features/users

Required Files:

- actions.ts
- services.ts
- repositories.ts
- queries.ts
- policies.ts
- schemas.ts

Features:

- Create User
- Update User
- Soft Delete User

Requirements:

- use BaseRepository
- use can("user.manage")
- emit user.created
- emit user.updated
- emit user.deleted

Generate complete production ready implementation.