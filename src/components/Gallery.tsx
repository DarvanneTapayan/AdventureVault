import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import Masonry from 'react-masonry-css';
import { motion } from 'motion/react';
import { MapPin, Calendar, Heart } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface GalleryProps {
  onSelect: (id: string) => void;
  userId?: string;
}

export const Gallery: React.FC<GalleryProps> = ({ onSelect, userId }) => {
  const [adventures, setAdventures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adventuresRef = collection(db, 'adventures');
    let q;
    
    if (userId) {
      q = query(
        adventuresRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'), 
        limit(20)
      );
    } else {
      q = query(
        adventuresRef, 
        orderBy('createdAt', 'desc'), 
        limit(20)
      );
    }

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
  }, []);

  const breakpointColumnsObj = {
    default: 3,
    1100: 3,
    700: 2,
    500: 1
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900" />
        ))}
      </div>
    );
  }

  if (adventures.length === 0) {
    return (
      <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
        <p className="text-zinc-500 font-light">No adventures found yet. Be the first to share one!</p>
      </div>
    );
  }

  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className="flex -ml-6 w-auto"
      columnClassName="pl-6 bg-clip-padding"
    >
      {adventures.map((adventure, index) => (
        <motion.div
          key={adventure.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="mb-6 group cursor-pointer"
          onClick={() => onSelect(adventure.id)}
        >
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 aspect-auto">
            <img 
              src={adventure.media[0]?.url} 
              alt={adventure.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <h3 className="text-lg font-medium text-white mb-2">{adventure.title}</h3>
              <div className="flex items-center gap-4 text-xs text-zinc-300">
                {adventure.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{adventure.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{adventure.likesCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-3 px-1">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">
                {adventure.title}
              </h4>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                {adventure.date ? new Date(adventure.date).getFullYear() : ''}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </Masonry>
  );
};
