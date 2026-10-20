import {timingSafeEqual} from "node:crypto";
export function validJobSecret(header:string|null,secret:string|undefined):boolean{
 if(!secret||secret.length<32||!header?.startsWith("Bearer "))return false;
 const expected=Buffer.from(secret),provided=Buffer.from(header.slice(7));
 return expected.length===provided.length&&timingSafeEqual(expected,provided);
}
