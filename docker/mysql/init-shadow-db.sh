#!/bin/sh
set -eu

shadow_database="${MYSQL_DATABASE}_shadow"

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" <<SQL
CREATE DATABASE IF NOT EXISTS \`${shadow_database}\`;
GRANT ALL PRIVILEGES ON \`${shadow_database}\`.* TO '${MYSQL_USER}'@'%';
SQL
