import React, { useState, useEffect } from 'react';
import { useAuth } from './FirebaseProvider';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Plus, Trash2, Edit2, ExternalLink, Image as ImageIcon, Film } from 'lucide-react';
import { UploadModal } from './UploadModal';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';

interface DashboardProps {
  onSelect: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelect }) => {
  const { user } = useAuth();
  const [adventures, setAdventures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const adventuresRef = collection(db, 'adventures');
    const q = query(
      adventuresRef, 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdventures(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'adventures');
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this adventure?')) return;

    try {
      await deleteDoc(doc(db, 'adventures', id));
      toast.success('Adventure deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete adventure');
    }
  };

  if (loading) {
    return (
      <div className="py-12 space-y-8">
        <Skeleton className="h-12 w-64 bg-zinc-900" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl bg-zinc-900" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-light tracking-tighter mb-2">Dashboard</h2>
          <p className="text-zinc-500 font-light">Manage your personal vault of adventures.</p>
        </div>
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-full px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Adventure
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adventures.map((adventure) => (
          <Card 
            key={adventure.id} 
            className="bg-zinc-900/50 border-zinc-800 overflow-hidden group cursor-pointer hover:border-zinc-700 transition-all"
            onClick={() => onSelect(adventure.id)}
          >
            <div className="relative aspect-video overflow-hidden">
              <img 
                src={adventure.media[0]?.url} 
                alt={adventure.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="w-8 h-8 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-700 hover:bg-red-500 hover:text-white"
                  onClick={(e) => handleDelete(adventure.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="absolute bottom-3 left-3 flex gap-2">
                <div className="px-2 py-1 rounded-md bg-zinc-950/60 backdrop-blur-md text-[10px] font-medium uppercase tracking-wider flex items-center gap-1">
                  {adventure.media.some((m: any) => m.type === 'video') ? <Film className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                  {adventure.media.length} {adventure.media.length === 1 ? 'Item' : 'Items'}
                </div>
              </div>
            </div>
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-medium text-zinc-100 group-hover:text-white transition-colors truncate pr-4">
                  {adventure.title}
                </h3>
                <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500 font-light line-clamp-1 mb-4">
                {adventure.description || 'No description provided.'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                  {adventure.date ? new Date(adventure.date).toLocaleDateString() : 'No date'}
                </span>
                <div className="flex gap-1">
                  {adventure.tags?.slice(0, 2).map((tag: string) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {adventures.length === 0 && (
          <div 
            className="col-span-full py-20 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-zinc-900/30 transition-colors"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-zinc-500 font-light">Start your journey by adding your first adventure.</p>
          </div>
        )}
      </div>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />
    </div>
  );
};
