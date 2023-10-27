#!/bin/sh

npm install
npm run build:lambdas

docker build -t 952085476791.dkr.ecr.eu-west-1.amazonaws.com/ssot-consumer-sandbox-ssot-stow-inventory:latest -f ./Dockerfile .

aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin 952085476791.dkr.ecr.eu-west-1.amazonaws.com

docker push 952085476791.dkr.ecr.eu-west-1.amazonaws.com/ssot-consumer-sandbox-ssot-stow-inventory:latest
