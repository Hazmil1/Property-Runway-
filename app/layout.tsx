import "./globals.css";
import { AppNav } from "@/components/AppNav";
export const metadata={title:"Property Runway",description:"Property and lease lifecycle operations"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><div className="app"><AppNav/><main className="main">{children}</main></div></body></html>}
