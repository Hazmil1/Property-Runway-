import { describe,expect,it } from "vitest";
import { calculateFeasibility } from "./feasibility";

describe("calculateFeasibility",()=>{
 it("flags a runway deficit when the process takes longer than time available",()=>{
  const r=calculateFeasibility({legalNoticeDate:new Date("2027-10-02T00:00:00Z"),requiredDays:180,today:new Date("2027-06-01T00:00:00Z")});
  expect(r.status).toBe("DEFICIT");
  expect(r.deficitDays).toBeGreaterThan(0);
 });
 it("shows a positive buffer when enough time remains",()=>{
  const r=calculateFeasibility({legalNoticeDate:new Date("2027-10-02T00:00:00Z"),requiredDays:120,today:new Date("2027-01-01T00:00:00Z")});
  expect(r.status).toBe("FEASIBLE");
  expect(r.bufferDays).toBeGreaterThan(30);
 });
 it("flags notice missed after the legal deadline",()=>{
  const r=calculateFeasibility({legalNoticeDate:new Date("2027-10-02T00:00:00Z"),requiredDays:60,today:new Date("2027-10-03T00:00:00Z")});
  expect(r.status).toBe("NOTICE_MISSED");
 });
});
