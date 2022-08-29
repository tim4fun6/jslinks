#!/bin/bash

source .env

SCRIPTPATH="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

npx surge "${SCRIPTPATH}/dist/" "${SURGE_DOMAIN}.surge.sh"

