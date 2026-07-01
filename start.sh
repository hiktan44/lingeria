#!/bin/sh
set -e

cd /app/backend
PORT=4000 node dist/server.js &
BACKEND_PID=$!

cd /app/frontend
PORT=3001 node server.js &
FRONTEND_PID=$!

wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?
exit $EXIT_CODE
