
import * as crypto from 'crypto';

// Function to generate a hash
export const calculateHash = (input: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(input);
  return hash.digest('hex');
}

// Function to map a hash to a range
export const  hashToRange = (input: string, rangeSize: number): number  => {
  const hash = calculateHash(input);
  const hashValue = parseInt(hash, 16); // Convert the hash to a numeric value
  return hashValue % rangeSize; // Apply modulo to map to the desired range
}
