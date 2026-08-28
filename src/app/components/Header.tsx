import { FileText, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/useAuth';
import { ProfileMenu } from './ProfileMenu';

export function Header() {
  const {currentUser, authLoading, refetch} = useAuth()
    const router = useRouter()
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <FileText className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">ResumeTailor</h1>
          </Link>

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
                <ProfileMenu
                  name={currentUser.name || currentUser.email}
                  onLogout={async () => {
                    await fetch("/api/logout", {
                      method: "POST",
                      credentials: "include"
                    });

                    await refetch();
                    router.push("/")
                  }}
                />
              )}
              </>
            )}
          </div>
        </div>
      </header>
    );
  }