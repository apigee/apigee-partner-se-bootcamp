#!/bin/sh

#apigeetool deployproxy -u $ae_username -p "$ae_password" -o $org -e test -n 'runload-1' -d . -V

./pushapi -v -o $org -n runload-1  -u "${ae_username}:${ae_password}" .
