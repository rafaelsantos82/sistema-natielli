#!/bin/sh
set -e

# /tmp is often a tmpfs in production (empty at start); create nginx temp dirs before start.
mkdir -p /tmp/nginx/client_body /tmp/nginx/proxy /tmp/nginx/fastcgi /tmp/nginx/uwsgi /tmp/nginx/scgi

exec /docker-entrypoint.sh nginx -g "daemon off;"
