import fs from 'node:fs';
import path from 'node:path';
import {getDb,REPO_ROOT} from './lib/db.mjs';
export async function seed(db){await db.exec('BEGIN');try{await db.exec(fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8'));await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}}
if(process.argv[1] && path.resolve(process.argv[1])===path.join(REPO_ROOT,'scripts/seed.mjs')){const db=await getDb();try{await seed(db);console.log('Synthetic media relations demo seeded; existing records preserved.');}finally{await db.close();}}
