// npx ts-node src/app/sdk/run_sdk.
// npx tsx /Users/williamphan/Desktop/tourguide/src/app/sdk/run_sdk.ts

import { generateMetadataFile } from './sdk';

async function main() {
  try {
    await generateMetadataFile(process.cwd());
  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();