#!/usr/bin/env bash
set -Eeuo pipefail

############################################################
#                        FUNCTIONS                         #
############################################################

function usage() {
    echo -e "\nUsage: $0 -p <PATH> -o <OUTPUT_PATH>"
    echo -e "\nGenerate HTML bundle based on a yaml openapi definition."
    echo -e "\nParameters: "
    echo -e " -p\t Fully qualified path to the openapi definition"
    echo -e " -o\t Fully qualified path to the output directory"
    exit 1
}

############################################################
#                                                          #
#                 SCRIPT STARTS HERE                       #
#                                                          #
############################################################

# Checking and loading parameters
while getopts p:o: flag;
do
    case "${flag}" in
        p) OPENAPI_PATH=${OPTARG} ;;
        o) OUTPUT_PATH=${OPTARG} ;;
        *) usage ;;
    esac
done

[ ! -f "$OPENAPI_PATH" ] && echo "Could not find \"$OPENAPI_PATH\", please specify an existing openapi specification file." && usage

npx @redocly/cli build-docs $OPENAPI_PATH
mv redoc-static.html redoc-$OUTPUT_PATH

python ./swagger-yaml-to-html.py < $OPENAPI_PATH > swagger-$OUTPUT_PATH