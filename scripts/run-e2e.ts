import { spawn } from "node:child_process";
import chromium from "@sparticuz/chromium";
const executablePath=await chromium.executablePath();const child=spawn(process.platform==="win32"?"npx.cmd":"npx",["playwright","test"],{stdio:"inherit",env:{...process.env,PLAYWRIGHT_EXECUTABLE_PATH:executablePath,PLAYWRIGHT_USE_PRODUCTION:"1",PLAYWRIGHT_DISABLE_VIDEO:"1",CI:""}});child.on("exit",(code)=>process.exit(code??1));
