import {describe,it,expect} from "vitest";
import {sameApplicationOrigin} from "./http-origin";
describe("application request origin",()=>{
 it("accepts the public origin behind a proxy",()=>expect(sameApplicationOrigin("https://property.example","http://localhost:10000","https://property.example")).toBe(true));
 it("rejects another site and internal origin when configured",()=>{
  expect(sameApplicationOrigin("https://evil.example","http://localhost:10000","https://property.example")).toBe(false);
  expect(sameApplicationOrigin("http://localhost:10000","http://localhost:10000","https://property.example")).toBe(false);
 });
 it("requires scheme and port to match",()=>expect(sameApplicationOrigin("http://127.0.0.1:3002","http://localhost:3001","http://127.0.0.1:3001")).toBe(false));
 it("supports same-origin local requests without configuration",()=>expect(sameApplicationOrigin("http://localhost:3000","http://localhost:3000")).toBe(true));
 it("rejects absent, malformed and opaque origins",()=>{
  for(const origin of [null,"null","not a url","https://user:password@property.example"])
   expect(sameApplicationOrigin(origin,"https://property.example")).toBe(false);
  expect(sameApplicationOrigin("https://property.example","https://property.example","invalid")).toBe(false);
 });
});
