#!/bin/sh

apigeetool deployproxy -u $ae_username -p "$ae_password" -o $org -e test -n 'oauth' -d . -V
