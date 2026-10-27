import { chromium } from "playwright";
import path from "node:path";
import assert from "node:assert/strict";

const browser = await chromium.launch({headless:true,executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe"});
try {
 const context = await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route("**/*",async route=>{
  const url = new URL(route.request().url());
  if(url.pathname.startsWith("/api/") || url.hostname==="api.postalpincode.in") {
   let data = [];
   if(url.pathname.endsWith("/leads/submit")) data={id:42,...route.request().postDataJSON(),district:"Coimbatore",state:"Tamil Nadu"};
   else if(url.pathname.includes("/leads/pincode/")) data={district:"Coimbatore",state:"Tamil Nadu",postOffices:[]};
   else if(url.pathname==="/api/home") data={categories:[],sections:[],banners:{},products:[]};
   if(url.hostname==="api.postalpincode.in") return route.fulfill({json:[{Status:"Success",PostOffice:[{District:"Coimbatore",State:"Tamil Nadu"}]}]});
   return route.fulfill({json:{success:true,data}});
  }
  if(url.hostname!=="zmw.local") return route.fulfill({status:200,body:""});
  try {await route.fulfill({path:path.join(process.cwd(),"dist",url.pathname==="/"?"index.html":url.pathname)});}
  catch {await route.fulfill({status:404,body:""});}
 });
 const page=await context.newPage();
 const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://zmw.local/");
 await page.locator("#zmw-loading-screen").waitFor({state:"detached"});
 await page.locator("#fvm-phone").fill("9876543210");
 await page.locator("#fvm-pincode").fill("641004");
 await page.getByRole("button",{name:"Confirm & Continue Shopping"}).click();
 await page.locator("#storefront-content").waitFor();
 const started=Date.now();
 assert.equal(await page.locator(".address-reminder").count(),0);
 console.log("Phone/PIN submitted. Waiting for the actual 30-second reminder...");
 await page.locator(".address-reminder").waitFor({timeout:35000});
 const elapsed=Date.now()-started;
 assert.ok(elapsed>=28500 && elapsed<35000, "Actual wait: "+elapsed);
 console.log("First popup visible after",elapsed,"ms");
 await page.screenshot({animations:"disabled",path:"C:/sts-projects/ZMW/.runtime/address-fixed-desktop.png"});
 await page.reload();
 await page.locator("#zmw-loading-screen").waitFor({state:"detached"});
 await page.locator(".address-reminder").waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("zmw_visitor_details")).addressReminder.count),1);
 console.log("Reload restores unfinished popup without consuming another attempt.");
 await page.clock.install();
 await page.clock.pauseAt(new Date(Date.now() + 1000));
 await page.getByRole("button",{name:"I'll do this later"}).click();
 await page.clock.fastForward(59999);
 assert.equal(await page.locator(".address-reminder").count(),0);
 await page.clock.fastForward(1);
 await page.locator(".address-reminder").waitFor();
 console.log("Final reminder appears at 60 seconds.");
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({animations:"disabled",path:"C:/sts-projects/ZMW/.runtime/address-fixed-mobile.png"});
 await page.getByRole("textbox",{name:"Full name",exact:true}).fill("Harish Kumar");
 await page.getByRole("textbox",{name:"House number / Street address",exact:true}).fill("12 Main Street");
 await page.getByRole("button",{name:"Save address & continue",exact:true}).click();
 assert.equal(await page.locator(".address-reminder").count(),0);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem("zmw_visitor_details")).address),"12 Main Street");
 console.log("Address saved. No further popup.");
 assert.deepEqual(errors,[]);
 await page.clock.resume();
 const legacy = await context.newPage();
 await legacy.goto("http://zmw.local/");
 await legacy.locator("#zmw-loading-screen").waitFor({state:"detached"});
 await legacy.evaluate(()=>localStorage.setItem("zmw_visitor_details",JSON.stringify({phone:"9876543210",pincode:"641004",savedAt:new Date().toISOString(),addressReminder:{count:2,nextAt:null}})));
 await legacy.reload();
 await legacy.locator("#zmw-loading-screen").waitFor({state:"detached"});
 await legacy.clock.install();
 await legacy.clock.fastForward(30000);
 await legacy.locator(".address-reminder").waitFor();
 console.log("Legacy stuck reminder state recovered without clearing site data.");
} finally {await browser.close();}

