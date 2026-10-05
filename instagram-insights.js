'use strict';
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

function encryptStore(data,secret){if(!secret)throw new Error('Instagram app secret is required for encrypted token storage.');const salt=crypto.randomBytes(16),iv=crypto.randomBytes(12),key=crypto.scryptSync(secret,salt,32),cipher=crypto.createCipheriv('aes-256-gcm',key,iv),encrypted=Buffer.concat([cipher.update(JSON.stringify(data),'utf8'),cipher.final()]);return{version:1,salt:salt.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),data:encrypted.toString('base64')};}
function decryptStore(record,secret){if(!record||record.version!==1||!secret)throw new Error('Instagram connection token store is unavailable.');const key=crypto.scryptSync(secret,Buffer.from(record.salt,'base64'),32),decipher=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(record.iv,'base64'));decipher.setAuthTag(Buffer.from(record.tag,'base64'));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(record.data,'base64')),decipher.final()]).toString('utf8'));}
function saveEncrypted(file,data,secret){fs.mkdirSync(path.dirname(file),{recursive:true});const temp=`${file}.${process.pid}.tmp`;fs.writeFileSync(temp,JSON.stringify(encryptStore(data,secret)),{mode:0o600});fs.renameSync(temp,file);try{fs.chmodSync(file,0o600);}catch{}}
function readEncrypted(file,secret){try{return decryptStore(JSON.parse(fs.readFileSync(file,'utf8')),secret);}catch{return null;}}
function isConfigured(env=process.env){return Boolean(env.INSTAGRAM_APP_ID&&env.INSTAGRAM_APP_SECRET&&env.INSTAGRAM_REDIRECT_URI&&env.META_GRAPH_VERSION);}
function authUrl(env,state){const url=new URL('https://www.instagram.com/oauth/authorize');url.searchParams.set('client_id',env.INSTAGRAM_APP_ID);url.searchParams.set('redirect_uri',env.INSTAGRAM_REDIRECT_URI);url.searchParams.set('scope','instagram_business_basic,instagram_business_manage_insights');url.searchParams.set('response_type','code');url.searchParams.set('state',state);url.searchParams.set('enable_fb_login','0');url.searchParams.set('force_authentication','1');return url.href;}
function metricValues(rows){const output={};for(const row of rows||[]){const value=Array.isArray(row.values)?row.values.at(-1)?.value:row.total_value?.value??row.value;if(value!==undefined)output[row.name]=value;}return output;}
module.exports={encryptStore,decryptStore,saveEncrypted,readEncrypted,isConfigured,authUrl,metricValues};
