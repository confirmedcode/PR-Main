#!/bin/bash

set -x

cd /home/node/main
git config --global credential.helper '!aws codecommit credential-helper $@'
git config --global credential.UseHttpPath true
# Point shared repo at the one in this environment and branch
npm install --save git+https://git-codecommit.$AWS_REGION.amazonaws.com/v1/repos/$ENVIRONMENT-Shared#$GIT_BRANCH
# Clear and reinstall node modules
rm -rf node_modules
npm install --production