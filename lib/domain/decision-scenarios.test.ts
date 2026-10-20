import {describe,expect,it} from "vitest";
import {buildDecisionScenarios} from "./decision-scenarios";

describe("buildDecisionScenarios",()=>{
 it("shows relocate as the longest default process",()=>{
  const rows=buildDecisionScenarios({legalNoticeDate:new Date("2027-12-31T00:00:00Z"),planningRunwayDays:180,today:new Date("2027-01-01T00:00:00Z")});
  const relocate=rows.find(x=>x.decision==="RELOCATE")!;
  const renew=rows.find(x=>x.decision==="RENEW")!;
  expect(relocate.processDays).toBeGreaterThan(renew.processDays);
 });
 it("uses tender plan duration where available",()=>{
  const rows=buildDecisionScenarios({legalNoticeDate:new Date("2027-12-31T00:00:00Z"),planningRunwayDays:180,tenderPlanDays:260,today:new Date("2027-01-01T00:00:00Z")});
  expect(rows.find(x=>x.decision==="RELOCATE")?.processDays).toBe(260);
 });
 it("flags options that no longer fit before notice",()=>{
  const rows=buildDecisionScenarios({legalNoticeDate:new Date("2027-06-01T00:00:00Z"),planningRunwayDays:180,today:new Date("2027-04-01T00:00:00Z")});
  expect(rows.find(x=>x.decision==="RELOCATE")?.feasibility.status).toBe("DEFICIT");
 });
});
