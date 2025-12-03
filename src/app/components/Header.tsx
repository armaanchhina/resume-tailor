import { FileText, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/useAuth';

export function Header() {
  const {currentUser, authLoading} = useAuth()
    const router = useRouter()
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => router.push("/")}>
            <FileText className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">ResumeTailor</h1>
          </div>

          <div className="flex items-center gap-4">
            { authLoading ? null : (
              <>
              {/* if not logged in -> Show Sign in Button */}
              {!currentUser && (
                <button onClick={() => router.push("/sign-in")} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Sign In
                </button>
              )}

              {currentUser && (
                <>
                <span className='text-sm text-gray-700'>
                  {currentUser.name || currentUser.email}
                </span>
                <button
                    onClick={async () => {
                      await fetch("/api/logout", {
                        method: "POST",
                        credentials: "include"
                      });

                      window.location.reload();
                    }}
                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium"
                  >
                    Logout
                  </button>
                </>
              )}
              </>
            )}
          </div>
        </div>
      </header>
    );
  }