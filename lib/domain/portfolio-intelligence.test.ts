import {describe,expect,it} from "vitest";
import {buildPortfolioIntelligence} from "./portfolio-intelligence";

const base={id:"1",category:"IT",ownerId:"u1",ownerName:"Alex",decision:"UNDECIDED",value:100000,autoRenews:true,actionByDate:new Date("2027-01-01T00:00:00Z"),legalNoticeDate:new Date("2027-03-01T00:00:00Z"),updatedAt:new Date("2026-01-01T00:00:00Z"),runwayStatus:"DECISION_DUE"};

describe("buildPortfolioIntelligence",()=>{
 it("aggregates decision value and owner workload",()=>{
  const r=buildPortfolioIntelligence([base,{...base,id:"2",value:50000,decision:"RELOCATE",runwayStatus:"BEHIND_RUNWAY"}],new Date("2026-12-01T00:00:00Z"));
  expect(r.decisionPipeline.find(x=>x.decision==="UNDECIDED")?.value).toBe(100000);
  expect(r.owners[0].leases).toBe(2);
  expect(r.owners[0].urgent).toBe(2);
 });
 it("calculates auto renewal exposure approaching notice",()=>{
  const r=buildPortfolioIntelligence([base],new Date("2026-12-15T00:00:00Z"));
  expect(r.autoRenewalDue90).toBe(100000);
 });
 it("marks long-unchanged undecided leases as stale",()=>{
  const r=buildPortfolioIntelligence([base],new Date("2026-12-15T00:00:00Z"));
  expect(r.staleDecisions).toBe(1);
 });
});
