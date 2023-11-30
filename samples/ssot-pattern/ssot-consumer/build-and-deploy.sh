#!/bin/sh

cd ./src

npm install
npm run build:lambdas


cd ../infra

terraform init
terraform plan
terraform apply -auto-approve