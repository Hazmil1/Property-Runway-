import {describe,it,expect} from "vitest";import {productionConfigProblems} from "./config";import {validJobSecret} from "../auth/job-secret";
const config={DATABASE_URL:"postgresql://user:example@localhost:5432/property",NEXT_PUBLIC_APP_URL:"https://property.example.test",NEXT_PUBLIC_SUPABASE_URL:"https://example.supabase.co",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"example-publishable",SUPABASE_SERVICE_ROLE_KEY:"example-server-only",BOOTSTRAP_OWNER_EMAIL:"owner@example.test",AI_EXTRACTION_MODE:"disabled"};
describe("Production deployment guardrails",()=>{
 it("allows the core application without optional email or AI providers",()=>expect(productionConfigProblems(config)).toEqual([]));
 it("rejects development identity, demo mode and mock extraction",()=>{const p=productionConfigProblems({...config,ALLOW_DEV_AUTH:"true",DEMO_ONLY:"true",AI_EXTRACTION_MODE:"mock"});expect(p).toHaveLength(3)});
 it("rejects incomplete integrations and insecure URLs without printing values",()=>{const p=productionConfigProblems({...config,NEXT_PUBLIC_APP_URL:"http://secret:password@site.test",RESEND_API_KEY:"secret",AI_EXTRACTION_MODE:"webhook"});expect(p.length).toBeGreaterThan(2);expect(p.join(" ")).not.toContain("password")});
 it("checks required owner and database configuration",()=>{expect(productionConfigProblems({...config,BOOTSTRAP_OWNER_EMAIL:"invalid",DATABASE_URL:"https://db.test"})).toHaveLength(2)});
 it("rejects invalid and unicode bearer values without throwing",()=>{const s="x".repeat(32);expect(validJobSecret("Bearer "+s,s)).toBe(true);expect(validJobSecret("Bearer "+"é".repeat(32),s)).toBe(false);expect(validJobSecret(null,s)).toBe(false);expect(validJobSecret("Bearer short","short")).toBe(false)});
});
