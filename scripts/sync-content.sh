#!/bin/sh
set -eu

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi

: "${OBSIDIAN_BLOG_DIR:?Set OBSIDIAN_BLOG_DIR in .env.local}"

if [ ! -d "$OBSIDIAN_BLOG_DIR" ]; then
  printf 'Obsidian blog directory not found: %s\n' "$OBSIDIAN_BLOG_DIR" >&2
  exit 1
fi

rsync -a --delete --delete-excluded \
  --exclude='/pending/' \
  --exclude='/.DS_Store' \
  "$OBSIDIAN_BLOG_DIR/" \
  content/posts/
