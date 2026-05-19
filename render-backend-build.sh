#!/bin/bash
set -e
export PATH="$HOME/.npm-global/bin:$PATH"
npm install -g pnpm@11.1.1 --prefix "$HOME/.npm-global"
pnpm install --ignore-scripts
pnpm --filter @workspace/api-server run build
