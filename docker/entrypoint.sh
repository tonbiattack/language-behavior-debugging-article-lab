#!/bin/sh
set -eu

redis-server --save "" --appendonly no &
java -Xms96m -Xmx192m -jar /opt/debuglab/spring-cache.jar &
exec node dist/index.js
