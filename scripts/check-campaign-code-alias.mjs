import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const aliasSource = readFileSync(join(root, 'src/lib/campaignCodeAlias.ts'), 'utf8');
const redirectSource = readFileSync(join(root, 'src/pages/CampaignRedirectPage.tsx'), 'utf8');
const satinAlSource = readFileSync(join(root, 'src/pages/SatinAlPage.tsx'), 'utf8');
const storeApiSource = readFileSync(join(root, 'src/lib/storeApi.ts'), 'utf8');

assert.match(aliasSource, /CMP_UF3NJKO5J5YIE:\s*['"]CMP_UF3NKO5J5YIE['"]/);
assert.match(aliasSource, /export function canonicalizeCampaignCode/);
assert.match(redirectSource, /canonicalizeCampaignCode\(id\)/);
assert.match(satinAlSource, /canonicalizeCampaignCode\(rawCampaignCode\)/);
assert.match(satinAlSource, /setSearchParams\(next,\s*\{\s*replace:\s*true\s*\}\)/);
assert.match(storeApiSource, /canonicalizeCampaignCode\(params\.campaignCode/);

console.log('frontend campaign alias wiring: ok');
