export function assertDevelopmentSeedAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed cannot run in production')
  }

  if (process.env.ALLOW_DEVELOPMENT_SEED !== 'true') {
    throw new Error('Development seed requires ALLOW_DEVELOPMENT_SEED=true')
  }

  const password = process.env.DEV_SEED_PASSWORD
  if (!password || password.length < 12) {
    throw new Error('DEV_SEED_PASSWORD minimal 12 karakter wajib diisi untuk development seed')
  }

  return password
}

export function assertMasterDataSeedAllowed() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MASTER_DATA_SEED !== 'true') {
    throw new Error('Master-data seed di production memerlukan ALLOW_MASTER_DATA_SEED=true')
  }
}

export function assertExportSeedAllowed() {
  if (process.env.ALLOW_EXPORT_SEED !== 'true') {
    throw new Error('Export seed requires ALLOW_EXPORT_SEED=true')
  }

  const password = process.env.IMPORT_SEED_ADMIN_PASSWORD
  if (!password || password.length < 12) {
    throw new Error('IMPORT_SEED_ADMIN_PASSWORD minimal 12 karakter wajib diisi')
  }

  return password
}
