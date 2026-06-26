"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";

const steps = [
  { path: "/profile", label: "Profile", labelZh: "個人檔案" },
  { path: "/jd-analysis", label: "JD Analysis", labelZh: "JD 分析" },
  { path: "/cv-generator", label: "CV", labelZh: "履歷" },
  { path: "/cover-letter", label: "Cover Letter", labelZh: "求職信" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg text-blue-700 shrink-0">
            JobMate AI
          </Link>

          <nav className="hidden sm:flex items-center gap-1 overflow-x-auto">
            {steps.map((step, i) => {
              const isActive = pathname.startsWith(step.path);
              return (
                <Link key={step.path} href={step.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`text-xs ${isActive ? "bg-blue-600" : "text-gray-500"}`}
                  >
                    <span className="mr-1.5 w-5 h-5 rounded-full border text-[10px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {language === "zh-TW" ? step.labelZh : step.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setLanguage(language === "en" ? "zh-TW" : "en")
            }
            className="text-xs shrink-0"
          >
            {language === "en" ? "繁中" : "EN"}
          </Button>
        </div>

        {/* Mobile step indicator */}
        <div className="sm:hidden flex justify-center gap-1 pb-3 overflow-x-auto">
          {steps.map((step, i) => {
            const isActive = pathname.startsWith(step.path);
            return (
              <Link key={step.path} href={step.path}>
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {i + 1}
                </span>
              </Link>
            );
          })}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
