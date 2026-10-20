import pg from 'pg';import {readFileSync} from 'node:fs';import {spawnSync} from 'node:child_process';import assert from 'node:assert/strict';
const source=new URL(process.env.DATABASE_URL);
if(process.env.CI!=='true'||!['localhost','127.0.0.1'].includes(source.hostname)||process.env.RUN_DATABASE_TESTS!=='true')throw Error('Only run against the isolated CI Postgres service');
const admin=new pg.Client({connectionString:source.href});await admin.connect();
await admin.query('CREATE DATABASE property_baseline_test');await admin.end();
source.pathname='/property_baseline_test';
const db=new pg.Client({connectionString:source.href});await db.connect();
const migration='20261020163000_initial_property_runway';
function prepare(enabled){return spawnSync('npm',['run','db:prepare'],{env:{...process.env,DATABASE_URL:source.href,BASELINE_EXISTING_SCHEMA:String(enabled)},encoding:'utf8'});}
try{
 await db.query(readFileSync('prisma/migrations/'+migration+'/migration.sql','utf8'));
 assert.notEqual(prepare(false).status,0,'Unreviewed nonempty database must be refused');
 await db.query('ALTER TABLE public."Property" ADD COLUMN unexpected_column text');
 assert.notEqual(prepare(true).status,0,'Schema drift must refuse baseline');
 await db.query('ALTER TABLE public."Property" DROP COLUMN unexpected_column');
 const adopted=prepare(true);assert.equal(adopted.status,0,adopted.stdout+adopted.stderr);
 assert.equal(prepare(false).status,0,'Repeat deployment must be idempotent');
 const result=await db.query('select migration_name from "_prisma_migrations" where finished_at is not null');
 assert.equal(result.rows[0].migration_name,migration);
 console.log('PASS existing-schema refusal, drift refusal, reviewed baseline and repeat deployment');
}finally{await db.end();}
