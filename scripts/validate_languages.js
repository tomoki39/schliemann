#!/usr/bin/env node
/**
 * Validate frontend/src/data/languages.json for Phase 7 data expansion readiness.
 * - Checks schema fields, id uniqueness, country codes, coordinates, dialect entries.
 * - Prints a concise report and exits non-zero on validation failure.
 */

const fs = require('fs');
const path = require('path');

function loadJson(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(text);
  } catch (e) {
    console.error(`[ERROR] Failed to read or parse JSON: ${filePath}`);
    console.error(e.message);
    process.exit(2);
  }
}

function isAlpha2(code) {
  return typeof code === 'string' && /^[A-Z]{2}$/.test(code);
}

function withinLatLngRange(center) {
  if (!center || typeof center !== 'object') return true; // optional
  const { lat, lng } = center;
  return (
    typeof lat === 'number' && typeof lng === 'number' && lat <= 90 && lat >= -90 && lng <= 180 && lng >= -180
  );
}

function validateDialect(d) {
  const errs = [];
  if (typeof d.name !== 'string' || !d.name.trim()) errs.push('dialect.name must be non-empty string');
  if (typeof d.region !== 'string' || !d.region.trim()) errs.push('dialect.region must be non-empty string');
  if (typeof d.sample_text !== 'string' || !d.sample_text.trim()) errs.push('dialect.sample_text must be non-empty string');
  if (typeof d.conversion_model !== 'string' || !d.conversion_model.trim()) errs.push('dialect.conversion_model must be non-empty string');
  if (typeof d.custom_input_enabled !== 'boolean') errs.push('dialect.custom_input_enabled must be boolean');
  return errs;
}

function main() {
  const dataPath = path.resolve(__dirname, '../frontend/src/data/languages.json');
  const languages = loadJson(dataPath);

  if (!Array.isArray(languages)) {
    console.error('[ERROR] languages.json must be an array of Language objects');
    process.exit(2);
  }

  const errors = [];
  const warnings = [];
  const idSet = new Set();

  languages.forEach((lang, idx) => {
    const prefix = `languages[${idx}] (id=${lang && lang.id})`;
    // Required
    if (typeof lang.id !== 'string' || !lang.id.trim()) errors.push(`${prefix}: id is required string`);
    if (typeof lang.name_ja !== 'string' || !lang.name_ja.trim()) errors.push(`${prefix}: name_ja is required string`);
    if (typeof lang.family !== 'string' || !lang.family.trim()) errors.push(`${prefix}: family is required string`);

    // Unique id
    if (typeof lang.id === 'string') {
      if (idSet.has(lang.id)) errors.push(`${prefix}: duplicate id '${lang.id}'`);
      idSet.add(lang.id);
    }

    // Optional: branch/subgroup strings
    if (lang.branch !== undefined && typeof lang.branch !== 'string') errors.push(`${prefix}: branch must be string if provided`);
    if (lang.subgroup !== undefined && typeof lang.subgroup !== 'string') errors.push(`${prefix}: subgroup must be string if provided`);

    // countries: ISO A2 uppercase
    if (lang.countries !== undefined) {
      if (!Array.isArray(lang.countries)) {
        errors.push(`${prefix}: countries must be array of ISO A2 strings`);
      } else {
        lang.countries.forEach((c, i) => {
          if (!isAlpha2(c)) errors.push(`${prefix}: countries[${i}] '${c}' must be ISO 3166-1 alpha-2 uppercase`);
        });
      }
    }

    // total_speakers: positive number
    if (lang.total_speakers !== undefined) {
      if (typeof lang.total_speakers !== 'number' || lang.total_speakers < 0) {
        errors.push(`${prefix}: total_speakers must be a non-negative number if provided`);
      }
    }

    // center: lat/lng range
    if (!withinLatLngRange(lang.center)) errors.push(`${prefix}: center lat/lng out of range`);

    // audio: shape
    if (lang.audio !== undefined) {
      if (typeof lang.audio !== 'object' || Array.isArray(lang.audio)) {
        errors.push(`${prefix}: audio must be an object`);
      } else {
        const { text, source } = lang.audio;
        if (text !== undefined && typeof text !== 'string') errors.push(`${prefix}: audio.text must be string if provided`);
        if (source !== undefined && typeof source !== 'string') errors.push(`${prefix}: audio.source must be string if provided`);
      }
    }

    // dialects
    if (lang.dialects !== undefined) {
      if (!Array.isArray(lang.dialects)) {
        errors.push(`${prefix}: dialects must be an array`);
      } else {
        lang.dialects.forEach((d, di) => {
          const ders = validateDialect(d);
          ders.forEach((e) => errors.push(`${prefix}: dialects[${di}]: ${e}`));
        });
      }
    }
  });

  // Report
  console.log(`languages.json: ${languages.length} entries`);
  if (warnings.length) {
    console.log(`Warnings (${warnings.length}):`);
    warnings.slice(0, 50).forEach((w) => console.log(`- ${w}`));
    if (warnings.length > 50) console.log(`... and ${warnings.length - 50} more warnings`);
  }
  if (errors.length) {
    console.error(`Validation FAILED with ${errors.length} error(s):`);
    errors.slice(0, 100).forEach((e) => console.error(`- ${e}`));
    if (errors.length > 100) console.error(`... and ${errors.length - 100} more errors`);
    process.exit(1);
  }
  console.log('Validation PASSED');
}

main();



