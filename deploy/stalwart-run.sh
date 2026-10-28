#!/usr/bin/env bash
# Recreate the Stalwart mail server container. All config/mail lives in the volumes.
# Own network so nginx's proxy address is distinct; HTTP uses X-Forwarded-For (set in WebUI).
set -e
docker network inspect stalwart-net >/dev/null 2>&1 || docker network create stalwart-net
docker run -d --name stalwart --init --restart unless-stopped \
  --hostname mail.ink2insight.com --network stalwart-net \
  -p 25:25 -p 465:465 -p 587:587 -p 993:993 \
  -p 127.0.0.1:8080:8080 -p 127.0.0.1:8443:443 \
  -v stalwart-etc:/etc/stalwart -v stalwart-data:/var/lib/stalwart \
  stalwartlabs/stalwart:v1
