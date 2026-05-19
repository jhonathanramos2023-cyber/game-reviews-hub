#!/bin/bash
set -e
npm install -g pnpm@11.1.1
cd artifacts/gamereviews
pnpm install --ignore-scripts
export VITE_API_ORIGIN=https://game-reviews-hub-api.onrender.com
pnpm run build
