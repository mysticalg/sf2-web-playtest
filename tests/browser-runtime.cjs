/* Real-file browser regressions. Install Playwright locally or use the Codex
 * web-game skill's existing installation. No application routes are patched. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{createRequire}=require('node:module');
let playwright;try{playwright=require('playwright');}catch(error){const skill=process.env.SF2_PLAYWRIGHT_MODULE||path.join(os.homedir(),'.codex','skills','develop-web-game','scripts','web_game_playwright_client.js');if(!fs.existsSync(skill))throw new Error('Install playwright, or set SF2_PLAYWRIGHT_MODULE to a module path that can resolve it');playwright=createRequire(skill)('playwright');}
const repo=path.resolve(__dirname,'..'),output=path.resolve(process.env.SF2_ARTIFACTS||path.join(repo,'work','finisher-tests'));
fs.mkdirSync(output,{recursive:true});
const artifacts=name=>path.join(output,name);
async function install(page){await page.addInitScript(()=>Object.defineProperty(window,'FIN',{get:()=>typeof AI_FINISHERS==='undefined'?null:AI_FINISHERS}));}
module.exports={chromium:playwright.chromium,install,artifacts,repo,url:process.env.SF2_TEST_URL||'http://127.0.0.1:8765/?edition=ai'};
