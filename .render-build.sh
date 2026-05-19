#!/bin/bash
set -e
cd /opt/render/project/src
npm install -g pnpm@11.1.1
pnpm install --ignore-scripts
export VITE_API_ORIGIN=https://game-reviews-hub-api.onrender.com
pnpm run build
