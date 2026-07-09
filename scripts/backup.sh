#!/bin/bash

# Simple Daily Backup Job for PostgreSQL Docker Container
# Usage: ./backup.sh

CONTAINER_NAME="ikmi-cirebon-web-db-1"
DB_USER="ikmi_user"
DB_NAME="ikmi_db"

BACKUP_DIR="./backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DATE}.sql"

mkdir -p $BACKUP_DIR

echo "Starting database backup..."
docker exec -t $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME -c > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "Backup successful: $BACKUP_FILE"
  # Compress backup
  gzip $BACKUP_FILE
  echo "Compressed to: ${BACKUP_FILE}.gz"
else
  echo "Backup failed!"
  exit 1
fi

# Optional: Delete backups older than 7 days
# find $BACKUP_DIR -type f -name "*.gz" -mtime +7 -exec rm {} \;
