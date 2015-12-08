#!/bin/sh

apigeetool deployproxy -i -u $ae_username -p $ae_password -o $org -e test -n 'runload-1' -d . -V