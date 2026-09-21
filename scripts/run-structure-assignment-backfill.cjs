if (process.env.STRUCTURE_ASSIGNMENT_BACKFILL === '1') {
  process.argv.push('--apply')
  require('./backfill-structure-assignments.cjs')
}
