import structure from './structure-master-data.json'

export const developmentPeriod = { id: 'dev-period', name: 'Development Period', cabinetName: 'Development Cabinet', status: 'ACTIVE' as const }
export const developmentDepartments = structure.departments.map((unit) => ({ ...unit, id: `dev-${unit.id.toLowerCase()}`, code: `DEV-${unit.code}`, name: `Development ${unit.code}`, periodId: developmentPeriod.id }))
export const developmentPositions = structure.positions.map((position) => ({ ...position, id: `dev-${position.id}`, departmentId: `dev-${position.departmentId.toLowerCase()}` }))
export const developmentAccounts = [
  { id: 'dev-release-super', name: 'Development Super Admin', email: 'dev-admin@example.test', roleId: 'super_admin', departmentId: 'dev-bph', positionId: 'dev-ketum' },
  { id: 'dev-release-organization', name: 'Development Organization Admin', email: 'dev-organization@example.test', roleId: 'admin_organization', departmentId: 'dev-bph', positionId: 'dev-sekum_1' },
  { id: 'dev-release-komdigi', name: 'Development Komdigi Admin', email: 'dev-komdigi@example.test', roleId: 'admin_komdigi', departmentId: 'dev-komdigi', positionId: 'dev-kadep_komdigi' },
]
export const developmentRolePermissions: Record<string, string[]> = {
  super_admin: [],
  admin_organization: ['organization.view', 'organization.update', 'structure.manage', 'registration.view', 'registration.review', 'member.view', 'user.view', 'user.update', 'calendar.view', 'calendar.manage', 'program.view', 'profile.update'],
  admin_komdigi: ['post.view', 'post.create', 'post.update', 'post.delete', 'post.submit', 'post.publish', 'cms.view', 'cms.update', 'article_queue.view', 'article_queue.manage', 'profile.update'],
}
