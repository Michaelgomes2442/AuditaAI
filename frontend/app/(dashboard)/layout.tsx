import React from "react";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";
import { requireUser } from "../../lib/auth";

export const metadata = { title: "Dashboard" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let session = null;
  try {
    session = await requireUser();
  } catch (err) {
    // unauthenticated — render fallback view that points to sign-in
    return (
      <html lang="en">
        <body>
          <div className="min-h-screen flex">
            <Sidebar />
            <div className="flex-1 flex flex-col">
              <Navbar />
              <main className="flex-1 p-6">Please <a href="/signin">sign in</a> to access the dashboard.</main>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            <Navbar />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
