// npx ts-node src/app/sdk/run_sdk.tsx

import { generateMetadataFile } from './sdk';

// Use the current directory as the project root
const projectRoot = process.cwd();

generateMetadataFile(projectRoot);