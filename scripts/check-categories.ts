import Database from "better-sqlite3";

const db = new Database("dev.db");

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as {name: string}[];
console.log("Tables:", tables.map(t => t.name));

for (const table of ["Character", "Weapon", "Summon"]) {
  if (!tables.find(t => t.name === table)) continue;
  const rows = db.prepare(`SELECT DISTINCT category FROM "${table}" WHERE category IS NOT NULL ORDER BY category`).all() as {category: string}[];
  console.log(`\n--- ${table} categories ---`);
  for (const r of rows) {
    console.log(`  "${r.category}"`);
  }
}

// Normalize: lowercase all categories
console.log("\n--- Normalizing categories to lowercase ---");
for (const table of ["Character", "Weapon", "Summon"]) {
  if (!tables.find(t => t.name === table)) continue;
  const result = db.prepare(`UPDATE "${table}" SET category = LOWER(category) WHERE category IS NOT NULL AND category != LOWER(category)`).run();
  console.log(`  ${table} category: ${result.changes} rows updated`);
}

// Normalize weaponType
const wtResult = db.prepare(`UPDATE Weapon SET weaponType = LOWER(weaponType) WHERE weaponType IS NOT NULL AND weaponType != LOWER(weaponType)`).run();
console.log(`  Weapon weaponType: ${wtResult.changes} rows updated`);

// Also normalize SystemExclusion values for category/weaponType types
const exResult = db.prepare(`UPDATE SystemExclusion SET value = LOWER(value) WHERE type IN ('category', 'weaponType') AND value != LOWER(value)`).run();
console.log(`  SystemExclusion (category/weaponType): ${exResult.changes} rows updated`);

// Verify
console.log("\n--- After normalization ---");
for (const table of ["Character", "Weapon", "Summon"]) {
  if (!tables.find(t => t.name === table)) continue;
  const rows = db.prepare(`SELECT DISTINCT category FROM "${table}" WHERE category IS NOT NULL ORDER BY category`).all() as {category: string}[];
  console.log(`\n--- ${table} categories ---`);
  for (const r of rows) {
    console.log(`  "${r.category}"`);
  }
}

db.close();
