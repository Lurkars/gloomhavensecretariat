#!/bin/sh
set -e

if [ "${NGINX_ACCESS_LOG:-on}" = "off" ]; then
    sed -i 's|access_log .*|access_log off;|' /etc/nginx/nginx.conf
fi
