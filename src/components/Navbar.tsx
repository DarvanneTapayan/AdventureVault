import React from 'react';
import { useAuth } from './FirebaseProvider';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Compass, Map, LayoutGrid, User, LogOut, PlusCircle, LogIn } from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  currentView: string;
  navigateTo: (view: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, navigateTo }) => {
  const { user, profile } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Welcome to AdventureVault!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigateTo('home');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log out');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => navigateTo('home')}
              className="text-xl font-light tracking-tighter flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Compass className="w-6 h-6" />
              <span>AdventureVault</span>
            </button>

            <div className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => navigateTo('home')}
                className={`text-sm font-medium transition-colors ${currentView === 'home' ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Explore
              </button>
              <button 
                onClick={() => navigateTo('timeline')}
                className={`text-sm font-medium transition-colors ${currentView === 'timeline' ? 'text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Timeline
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden sm:flex items-center gap-2 text-zinc-400 hover:text-zinc-100"
                  onClick={() => navigateTo('dashboard')}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>New Adventure</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="outline-none">
                      <Avatar className="w-8 h-8 border border-zinc-800">
                        <AvatarImage src={profile?.photoURL || user.photoURL || ''} />
                        <AvatarFallback className="bg-zinc-900 text-zinc-400">
                          {user.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-100">
                    <div className="px-2 py-1.5 text-sm font-medium text-zinc-400">
                      {user.email}
                    </div>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={() => navigateTo('profile')} className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>My Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigateTo('dashboard')} className="focus:bg-zinc-800 focus:text-zinc-100 cursor-pointer">
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={handleLogout} className="focus:bg-zinc-800 focus:text-red-400 text-red-500 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={handleLogin}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-medium rounded-full px-6"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
