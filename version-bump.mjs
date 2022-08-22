/**
 * This script makes it slightly easier to release new versions of your
 * theme. If you are not using Github Releases with your theme, or
 * you are not interested in automating the process, you can safely ignore
 * this script.
 *
 * Usage: `$ npm run version`
 *
 * This script will automatically add a new entry to the versions.json file for
 * the current version of your theme.
 */

import { readFileSync, writeFileSync } from "fs";

const targetVersion = process.env.npm_package_version;

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
