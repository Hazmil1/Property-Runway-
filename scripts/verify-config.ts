import "dotenv/config";import {productionConfigProblems} from "../lib/deployment/config";
const problems=productionConfigProblems(process.env);
if(problems.length){console.error("Deployment configuration is incomplete:\n"+problems.map(p=>"- "+p).join("\n"));process.exit(1)}
console.log("Production configuration checks passed (no secret values printed).");
