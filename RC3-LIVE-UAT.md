# RC3 Live UAT

Date: 2026-06-10

## Required Users

| Role | Email | Credential Status |
| --- | --- | --- |
| Super Admin | `rc.superadmin@ikmi.ac.id` | PASS |
| Ketua Umum | `rc.ketua@ikmi.ac.id` | PASS |
| Bendahara | `rc.bendahara@ikmi.ac.id` | PASS |
| Ketua Departemen | `rc.kadep@ikmi.ac.id` | PASS |
| Anggota Departemen | `rc.anggota@ikmi.ac.id` | PASS |

All RC users are active and the development RC password validates against stored hashes.

## RBAC Evidence

Verified key permissions from database:

- Super Admin has full checked permissions through role mapping.
- Ketua Umum has `finance.approve_tier2` and `lpj.verify_bph`.
- Bendahara has `finance.approve_tier1`, `finance.approve_tier2`, and `lpj.verify_bph`.
- Ketua Departemen has `finance.create`, `lpj.submit`, `lpj.verify_department`, `post.publish`, and `cms.update`.
- Anggota Departemen has `lpj.submit`.

## Page Smoke

- `/login`: 200
- `/admin` unauthenticated: 307 redirect
- Public routes: 200

## Limitation

In-app browser tooling was unavailable in this session, so full visual login, menu visibility, button visibility, and ownership walkthrough could not be executed as real browser clicks.

## Status

Credential/RBAC readiness: PASS.

Live browser UAT: BLOCKED BY TOOLING / STAGING ACCESS.

