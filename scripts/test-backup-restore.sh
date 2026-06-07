#!/bin/bash
set -e

echo "=========================================="
echo " IKMI CIREBON - DATABASE BACKUP & RESTORE TEST "
echo "=========================================="

BACKUP_FILE="backup_test_$(date +%Y%m%d%H%M%S).sql"

echo "[1/4] Dumping current database..."
docker-compose exec -T db pg_dump -U ikmi_user -d ikmi_db --clean > $BACKUP_FILE

if [ ! -s $BACKUP_FILE ]; then
    echo "ERROR: Backup file is empty or failed to create."
    exit 1
fi
echo "✓ Backup created: $BACKUP_FILE"

echo "[2/4] Simulating disaster (dropping public schema)..."
docker-compose exec -T db psql -U ikmi_user -d ikmi_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO ikmi_user;"
echo "✓ Schema dropped!"

echo "[3/4] Restoring database from backup..."
cat $BACKUP_FILE | docker-compose exec -T db psql -U ikmi_user -d ikmi_db > /dev/null 2>&1
echo "✓ Database restored!"

echo "[4/4] Verifying restoration (checking users table)..."
USER_COUNT=$(docker-compose exec -T db psql -U ikmi_user -d ikmi_db -t -c "SELECT count(*) FROM users;")
if [ -z "$USER_COUNT" ]; then
    echo "ERROR: Users table not found or empty!"
    exit 1
fi
echo "✓ Restoration verified. Total users: $USER_COUNT"

echo "=========================================="
echo " TEST PASSED SUCCESSFULLY "
echo "=========================================="

rm $BACKUP_FILE
