#!/bin/bash

APP_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "===== DEPLOY START ====="

cd "$APP_DIR" || exit 1

git fetch origin
git reset --hard origin/main

pm2 reload ecosystem.config.js --env production

pm2 save

echo "===== DEPLOY FINISHED ====="
