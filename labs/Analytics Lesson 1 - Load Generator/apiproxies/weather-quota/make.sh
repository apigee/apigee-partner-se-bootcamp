#!/bin/sh

apigeetool deployproxy -u $ae_username -p $ae_password -o $org -e $env -n 'weather-quota' -d . -V