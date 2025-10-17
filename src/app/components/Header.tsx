import { FileText, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Header() {
    const router = useRouter()
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-7 h-7 text-indigo-600" />
            <h1 onClick={() => router.push("/")} className="text-2xl font-bold text-gray-900">ResumeTailor</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Sign In
            </button>
          </div>
        </div>
      </header>
    );
  }