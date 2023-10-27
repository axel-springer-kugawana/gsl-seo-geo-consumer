import * as crypto from 'crypto';
import { config } from 'ssot-api/config/configuration-provider';

const hashRange = config.get("ssotBucketHashRange");


const calculateHash = (input: string): string => {
    const hash = crypto.createHash('sha256');
    hash.update(input);
    return hash.digest('hex');
}

const hashToRange = (input: string, rangeSize: number): number => {
    const hash = calculateHash(input);
    const hashValue = parseInt(hash, 16); // Convert the hash to a numeric value
    return hashValue % rangeSize; // Apply modulo to map to the desired range
}


const generateS3bucketCommonPrefixLayoutWithTrailingSlash_V0 = (opts: { partition?: string, dataVersion: string, hash: string }): string => {

    let layout = `${opts.dataVersion}/${opts.hash}/`;

    if (opts.partition) {
        layout = `${opts.partition}/${layout}`;
    }

    return layout;
}


export const generateS3bucketActivePrefixLayoutWithTrailingSlash_V0 = (opts: { partition?: string, dataVersion: string, hash: string }): string => {
    return `active/${generateS3bucketCommonPrefixLayoutWithTrailingSlash_V0(opts)}`;
}


export const generateS3bucketDeletedPrefixLayoutWithTrailingSlash_V0 = (opts: { partition?: string, dataVersion: string, hash: string }): string => {
    return `deleted/${generateS3bucketCommonPrefixLayoutWithTrailingSlash_V0(opts)}`;
}


export const generateS3bucketForActiveObjectKey_V0 = (opts: { partition?: string, dataVersion: string, identifier: string }): string => {
    const hashFromRange = hashToRange(opts.identifier, hashRange);
    return `${generateS3bucketActivePrefixLayoutWithTrailingSlash_V0({ partition: opts.partition, hash: hashFromRange.toString(), dataVersion: opts.dataVersion })}${opts.identifier}.json`;
}

export const generateS3bucketForDeletedObjectKey_V0 = (opts: { partition?: string, dataVersion: string, identifier: string }): string => {
    const hashFromRange = hashToRange(opts.identifier, hashRange);
    return `${generateS3bucketDeletedPrefixLayoutWithTrailingSlash_V0({ partition: opts.partition, hash: hashFromRange.toString(), dataVersion: opts.dataVersion })}${opts.identifier}.json`;
}