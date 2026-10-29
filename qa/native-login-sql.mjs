// Run with PGLITE_TEST_MODULE pointing to an existing @electric-sql/pglite module.
if(!process.env.PGLITE_TEST_MODULE)throw Error('PGLITE_TEST_MODULE is required for isolated real SQL QA');
const {PGlite}=await import(process.env.PGLITE_TEST_MODULE);
import fs from 'node:fs';import vm from 'node:vm';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import crypto from 'node:crypto';
const appUnderTest='lingeria',work=path.dirname(new URL(import.meta.url).pathname),root=path.resolve(work,'..');
const req=createRequire(path.join(root,'backend/package.json')),ts=req('typescript');
const jwt=appUnderTest==='lingeria'?req('jsonwebtoken'):null;
const jose=appUnderTest==='ihaleab'?req('jose'):null;
function load(file,imports){const code=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;const mod={exports:{}};vm.runInNewContext(code,{module:mod,exports:mod.exports,require:id=>{assert.ok(id in imports,id);return imports[id]},process,console,TextEncoder});return mod.exports}
const secret='synthetic-test-signing-material-32-characters';const id='11111111-1111-4111-8111-111111111111',email='fixture@example.invalid';
for(const [app,prefix] of [['ihaleab','ihaleab'],['fasheone-style','style'],['lingeria','lingeria']].filter(([name])=>name===appUnderTest)){
 const pg=new PGlite();await pg.exec('CREATE TABLE users(id text PRIMARY KEY,email text NOT NULL,role text NOT NULL DEFAULT \'user\',session_version integer NOT NULL DEFAULT 0)');
 const migration='BEGIN;'+fs.readFileSync(path.join(root,'backend/migrations/20261029_issued_login_journal.sql'),'utf8')+'COMMIT;';await pg.exec(migration);await pg.exec(migration);
 const table=prefix+'_issued_login_events',state=prefix+'_issued_login_source_state';
 await pg.query('INSERT INTO users VALUES($1,$2,$3,0)',[id,email,'user']);
 let commitFail=false;let rollbackObserved=false;
 const query=async(sql,values=[])=>{if(sql==='COMMIT'&&commitFail)throw Error('fixture commit unavailable');if(sql==='ROLLBACK')rollbackObserved=true;return pg.query(sql,values)};
 const transact=async fn=>{await query('BEGIN');try{const result=await fn();await query('COMMIT');return result}catch(e){await query('ROLLBACK');throw e}};
 let write;
 if(app==='ihaleab'){
  const tag=async(parts,...values)=>{const sql=parts.reduce((s,p,i)=>s+(i?'$'+i:'')+p,'');return(await query(sql,values)).rows};tag.begin=fn=>transact(()=>fn(tag));
  const claims={sub:id,email,role:'viewer',session_version:0};
  const jwtHelpers=load('backend/src/lib/jwt.ts',{'jose':jose,'./config.js':{env:{jwtSecret:secret}}});
  const helper=load('backend/src/lib/loginEvents.ts',{'node:crypto':crypto,'hono/http-exception':req('hono/http-exception'),'./db.js':{sql:tag},'./jwt.js':jwtHelpers});
  write=async(method='password',override={})=>helper.recordLoginEvent(id,method,await jwtHelpers.signSession({...claims,...override}));
 }else if(app==='lingeria'){
  const helper=load('backend/src/utils/loginEvents.ts',{'crypto':crypto,'jsonwebtoken':jwt,'../config/database':{getClient:async()=>({query,release(){}})}});
  write=async(method='password',override={})=>helper.recordLoginEvent(id,method,jwt.sign({id,email,...override},secret,{expiresIn:'1h'}),secret);
 }else{
  const tx={$executeRawUnsafe:async(sql,...values)=>(await query(sql,values)).affectedRows,$queryRawUnsafe:async(sql,...values)=>(await query(sql,values)).rows};
  const prisma={$transaction:fn=>transact(()=>fn(tx))};const {PrismaRepo}=load('apps/api/src/data/prisma.repo.ts',{'@prisma/client':{PrismaClient:class{constructor(){return prisma}}}});const repo=new PrismaRepo();
  write=async(method='password',override={})=>repo.recordLoginEvent(id,method,{eventId:crypto.createHash('sha256').update(JSON.stringify({method,...override})).digest('hex'),email:override.email??email});
 }
 const rows=async()=>(await pg.query('SELECT * FROM '+table+' ORDER BY at,id')).rows;
 await write();await write();assert.equal((await rows()).length,1);assert.equal((await rows())[0].excluded,false);assert.ok(!JSON.stringify(await rows()).includes('@'));
 await pg.query('DELETE FROM users WHERE id=$1',[id]);assert.equal((await rows()).length,1);await assert.rejects(write());
 await pg.query('INSERT INTO users VALUES($1,$2,$3,0)',[id,email,app==='lingeria'?'user':'admin']);await pg.exec('DELETE FROM '+table);await write();assert.equal((await rows())[0].excluded,app!=='lingeria');
 await pg.exec('DELETE FROM '+table);await pg.query('UPDATE users SET role=$1 WHERE id=$2',['user',id]);
 await assert.rejects(()=>write('password',{email:'other@example.invalid'}));assert.equal((await rows()).length,0);
 commitFail=true;await assert.rejects(write());commitFail=false;assert.equal((await rows()).length,0);assert.equal(rollbackObserved,true);
 await pg.query('UPDATE users SET email=$1 WHERE id=$2',['hikmet044@gmail.com',id]);await write('password',{email:'hikmet044@gmail.com'});assert.equal((await rows())[0].excluded,true);
 if(app==='fasheone-style'){
  await pg.exec('DELETE FROM '+table);await pg.query('UPDATE users SET email=$1 WHERE id=$2',[email,id]);process.env.ADMIN_EMAILS=email;await write();delete process.env.ADMIN_EMAILS;assert.equal((await rows())[0].excluded,true);
 }
 await pg.exec('DROP TABLE '+table);await pg.exec(`UPDATE ${state} SET installed_at='2020-01-01Z'`);await pg.exec(migration);assert.equal((await rows()).length,0);assert.ok(new Date((await pg.query('SELECT installed_at FROM '+state)).rows[0].installed_at)>new Date('2020-01-02Z'));
 await pg.exec('ALTER TABLE '+table+' ENABLE ROW LEVEL SECURITY');await assert.rejects(()=>pg.exec(migration));await pg.exec('ROLLBACK');await pg.exec('ALTER TABLE '+table+' DISABLE ROW LEVEL SECURITY');
 await pg.exec('DROP TABLE '+table);await assert.rejects(write());
 await pg.close();console.log(app+': real PostgreSQL syntax, idempotence, canonical identity, exclusion, delete survival, commit rollback, epoch recovery, RLS and missing journal passed');
}
