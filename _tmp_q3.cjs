require('dotenv/config');
const { Client } = require('pg');
(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  // Look for any "nature" or "wood" or "fiber" or "blanket" ingredient with density
  const ing = await c.query("SELECT name, type, cost_per_ton, density_lbs_per_cuft FROM ops_ingredients WHERE density_lbs_per_cuft IS NOT NULL ORDER BY name");
  console.log('=== ALL ingredients with density ===');
  ing.rows.forEach(r => console.log(' ', (r.name || '').padEnd(50), 'density=' + r.density_lbs_per_cuft + ' lb/cuft', 'cost/ton=$' + r.cost_per_ton));
  await c.end();
})().catch(e => console.error('ERR', e.message));
