import { describe, expect, it } from "vitest";
import { calculateRunway } from "./runway";

describe("calculateRunway",()=>{
  it("calculates legal notice and action-by dates backwards from expiry",()=>{
    const result=calculateRunway({
      expiryDate:new Date("2027-12-31T00:00:00Z"),
      contractualNoticeDays:90,
      planningRunwayDays:180,
      today:new Date("2027-01-01T00:00:00Z")
    });
    expect(result.legalNoticeDate.toISOString().slice(0,10)).toBe("2027-10-02");
    expect(result.actionByDate.toISOString().slice(0,10)).toBe("2027-04-05");
    expect(result.status).toBe("ON_TRACK");
  });

  it("marks a lease behind runway after the operational action date",()=>{
    const result=calculateRunway({
      expiryDate:new Date("2027-12-31T00:00:00Z"),
      contractualNoticeDays:90,
      planningRunwayDays:180,
      today:new Date("2027-06-01T00:00:00Z")
    });
    expect(result.status).toBe("BEHIND_RUNWAY");
    expect(result.runwayDeficitDays).toBeGreaterThan(0);
  });

  it("marks notice missed after the legal notice deadline",()=>{
    const result=calculateRunway({
      expiryDate:new Date("2027-12-31T00:00:00Z"),
      contractualNoticeDays:90,
      planningRunwayDays:180,
      today:new Date("2027-10-03T00:00:00Z")
    });
    expect(result.status).toBe("NOTICE_MISSED");
  });

  it("rejects negative notice or runway values",()=>{
    expect(()=>calculateRunway({
      expiryDate:new Date("2027-12-31T00:00:00Z"),
      contractualNoticeDays:-1,
      planningRunwayDays:180
    })).toThrow("Days cannot be negative");
  });
});
