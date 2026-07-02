const WS = require(process.cwd()+'/frontend/node_modules/ws');
const http = require('http');
const fs = require('fs');

function getTarget(){return new Promise((res,rej)=>{
  http.get('http://127.0.0.1:9223/json',r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(JSON.parse(d)[0]));}).on('error',rej);
});}

(async()=>{
  const t = await getTarget();
  const ws = new WS(t.webSocketDebuggerUrl, {maxPayload: 64*1024*1024});
  let id=0; const pending={};
  const send=(method,params={})=>new Promise(r=>{const i=++id;pending[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
  await new Promise(r=>ws.on('open',r));
  ws.on('message',m=>{const o=JSON.parse(m);if(o.id&&pending[o.id]){pending[o.id](o.result);delete pending[o.id];}});
  await send('Page.enable'); await send('Runtime.enable');
  // wait for the store + catalog to load
  await new Promise(r=>setTimeout(r,3500));
  // drive: open checkout review with saved address+card by faking the ui_command via the store
  const js = `(()=>{
    const s = window.__store.getState();
    const cat = s.catalog;
    const it = cat.find(p=>p.category==='Rainwear') || cat[0];
    const items=[{sku_id:it.id,name:it.name,size:'M',qty:1,price:it.price,image:it.image}];
    const data={items,subtotal:it.price,discount:0,total:it.price,promo:null,
      name:'Aisha Sharma',
      address:{line1:'402, Prestige Lakeside Habitat',line2:'Varthur Road, Gunjur',city:'Bengaluru',state:'Karnataka',pincode:'560087',country:'India'},
      payment:{last4:'1234',type:'Visa Credit',expiry:'08/29'}};
    s.applyCommand('checkout',{step:'review',data});
    return it.name;
  })()`;
  const r = await send('Runtime.evaluate',{expression:js,returnByValue:true});
  console.log('checkout item:', r.result && r.result.value);
  await new Promise(r=>setTimeout(r,800));
  const shot = await send('Page.captureScreenshot',{format:'png'});
  fs.writeFileSync('scripts/_checkout_review.png', Buffer.from(shot.data,'base64'));
  console.log('saved scripts/_checkout_review.png');
  ws.close();
})().catch(e=>{console.error(e);process.exit(1);});
