#!/bin/sh
set -eu

dns_server="$(awk '/^[[:space:]]*nameserver[[:space:]]+/ { print $2; exit }' /etc/resolv.conf)"
if [ -z "$dns_server" ]; then
    echo "No DNS resolver found in /etc/resolv.conf" >&2
    exit 1
fi

sed -i "s|__DNS_RESOLVER__|${dns_server}|g" /etc/nginx/conf.d/default.conf
