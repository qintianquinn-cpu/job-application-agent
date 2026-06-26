import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  { step: "1", title: "Fill Profile", zh: "填寫檔案", desc: "Your background, experience, and skills" },
  { step: "2", title: "Paste JD", zh: "貼上JD", desc: "AI analyzes requirements vs. your profile" },
  { step: "3", title: "Get CV", zh: "生成履歷", desc: "Tailored CV emphasizing relevant experience" },
  { step: "4", title: "Get Cover Letter", zh: "生成求職信", desc: "Compelling letter connecting you to the role" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4">
          JobMate AI
        </h1>
        <p className="text-lg text-gray-600 mb-2">
          Your intelligent job application assistant
        </p>
        <p className="text-lg text-gray-500 mb-2">
          你的智能求職助手
        </p>
        <p className="text-gray-500 max-w-xl mx-auto mb-10 text-sm sm:text-base">
          Paste a job description, get a tailored CV and cover letter in seconds.
          <br />
          Powered by AI. Privacy-first — your data stays on your device.
        </p>

        <Link href="/profile">
          <Button size="lg" className="text-base px-8">
            Get Started / 開始使用
          </Button>
        </Link>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-16">
          {features.map((item) => (
            <Card key={item.step}>
              <CardContent className="pt-6 text-center">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-gray-500 mb-1">{item.zh}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
