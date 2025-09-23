#!/usr/bin/env node

// Fetch official languages per country from Wikidata SPARQL endpoint.
// Output: frontend/src/data/countries_official_languages.json

const fs = require('fs');
const path = require('path');
const https = require('https');

const ENDPOINT = 'https://query.wikidata.org/sparql';

const QUERY = `
SELECT ?countryCode ?lang3 WHERE {
  ?country wdt:P31 wd:Q6256;        # instance of: country
           wdt:P297 ?countryCode.    # ISO 3166-1 alpha-2
  OPTIONAL {
    ?country wdt:P37 ?lang .        # official language
    OPTIONAL { ?lang wdt:P220 ?lang3. }  # ISO 639-3 code
  }
}
`;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'accept': 'application/sparql-results+json', 'user-agent': 'rinzo-fetch/1.0 (demo)' } }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        res.resume();
        return;
      }
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const url = ENDPOINT + '?format=json&query=' + encodeURIComponent(QUERY);
  const data = await fetchJson(url);
  const rows = data.results.bindings;

  const countryToLangs = {};
  for (const row of rows) {
    const cc = row.countryCode && row.countryCode.value;
    const l3 = row.lang3 && row.lang3.value; // may be undefined
    if (!cc) continue;
    if (!countryToLangs[cc]) countryToLangs[cc] = new Set();
    if (l3) countryToLangs[cc].add(l3);
  }

  const output = {};
  for (const [cc, langs] of Object.entries(countryToLangs)) {
    const arr = Array.from(langs);
    if (arr.length > 0) output[cc] = { official_languages: arr };
  }

  const outPath = path.resolve(__dirname, '../frontend/src/data/countries_official_languages.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log('Wrote', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
