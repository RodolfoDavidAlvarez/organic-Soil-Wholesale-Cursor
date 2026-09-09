import fs from 'node:fs';
import dotenv from 'dotenv';
import {createClient} from '@supabase/supabase-js';
if(!process.argv[2]||process.argv[3]!=='--apply')throw new Error('Usage: node scripts/sync-approved-representatives.mjs ENV_FILE --apply');
const env=dotenv.config({path:process.argv[2],quiet:true}).parsed;
if(!env?.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Service credentials unavailable');
const db=createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY);
const approved=JSON.parse(fs.readFileSync('client/src/pages/representative-card-data.json','utf8'));
const {data:previous,error}=await db.from('representatives').select('*').in('slug',Object.keys(approved));if(error)throw error;
fs.writeFileSync(`/tmp/osw-representatives-before-${Date.now()}.json`,JSON.stringify(previous,null,2),{mode:0o600,flag:'wx'});
for(const [slug,p] of Object.entries(approved)){
  const row=previous.find(r=>r.slug===slug);
  const fields={name:p.name,email:p.email,phone:p.tel,title:p.role,company_name:'Soil Seed & Water',website:'https://www.organicsoilwholesale.com/rep/'+slug,bio:'Local soil sales with Organic Soil Wholesale and online shopping with Soil Seed & Water.',address:'1634 N 19th Ave',city:'Phoenix',state:'AZ',zip_code:'85009',social_links:{...(row?.social_links||{}),instagram:'https://www.instagram.com/soilseedandwater/',facebook:'https://www.facebook.com/profile.php?id=100083162860601',tiktok:'https://www.tiktok.com/@soilseedandwaterusa',youtube:'https://www.youtube.com/@soilseedwater'},is_active:true};
  const query=row?db.from('representatives').update(fields).eq('id',row.id).eq('slug',slug):db.from('representatives').insert({...fields,slug});
  const {data,error}=await query.select('id,slug,name,email,phone,title').single();if(error)throw error;console.log(JSON.stringify(data));
}
