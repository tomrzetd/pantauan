import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const reg=JSON.parse(fs.readFileSync(path.join(root,'schools.json'),'utf8'));
assert.equal(reg.version,1);
assert(Array.isArray(reg.schools));
const codes=new Set();
for(const s of reg.schools){
  assert(/^[A-Z0-9]{3,8}$/.test(s.code));
  assert(!codes.has(s.code));codes.add(s.code);
  assert(typeof s.name==='string'&&s.name.length>0&&s.name.length<150);
  assert(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(s.endpoint));
  assert.deepEqual(Object.keys(s).sort(),['code','endpoint','name']);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
assert(html.includes('id="activationInput"'));
assert(!html.includes('id="serverInput"')&&!html.includes('id="keyInput"'));
assert(!html.includes('hero-motion')&&!html.includes('ambient-orb'));
assert(js.includes("body:JSON.stringify({action:'summary',session:D.session})"));
assert(js.includes('pantauan-session-v3'));
assert(css.includes('body[data-mode=easy]'));
assert(!fs.existsSync(path.join(root,'backend','Dashboard.gs')));
console.log('PASS PANTAUAN v3: public registry, code activation, signed session, easy mode; private backend excluded');
