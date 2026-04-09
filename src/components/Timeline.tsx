import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { MapPin, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from './ui/skeleton';

interface TimelineProps {
  onSelect: (id: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ onSelect }) => {
  const [adventures, setAdventures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adventuresRef = collection(db, 'adventures');
    const q = query(adventuresRef, orderBy('date', 'desc'));

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

  if (loading) {
    return (
      <div className="space-y-12 py-12">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-8">
            <Skeleton className="w-24 h-8 bg-zinc-900" />
            <Skeleton className="flex-1 h-64 rounded-3xl bg-zinc-900" />
          </div>
        ))}
      </div>
    );
  }

  if (adventures.length === 0) {
    return (
      <div className="text-center py-32">
        <p className="text-zinc-500 font-light">No adventures in your timeline yet.</p>
      </div>
    );
  }

  // Group by year
  const grouped = adventures.reduce((acc: any, adventure) => {
    const year = adventure.date ? new Date(adventure.date).getFullYear() : 'Unknown';
    if (!acc[year]) acc[year] = [];
    acc[year].push(adventure);
    return acc;
  }, {});

  const years = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="py-12">
      <h2 className="text-4xl font-light tracking-tighter mb-16">Journey Timeline</h2>
      
      <div className="space-y-24">
        {years.map((year) => (
          <div key={year} className="relative">
            <div className="sticky top-24 z-10 mb-8">
              <h3 className="text-6xl font-serif italic text-zinc-800 absolute -left-12 -top-8 select-none pointer-events-none">
                {year}
              </h3>
              <div className="h-px bg-zinc-800 w-full" />
            </div>

            <div className="space-y-16 pl-4 md:pl-12 border-l border-zinc-800 ml-4 md:ml-0">
              {grouped[year].map((adventure: any, index: number) => (
                <motion.div
                  key={adventure.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col md:flex-row gap-8 group cursor-pointer"
                  onClick={() => onSelect(adventure.id)}
                >
                  <div className="md:w-1/3">
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-900">
                      <img 
                        src={adventure.media[0]?.url} 
                        alt={adventure.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  
                  <div className="md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-3 text-xs text-zinc-500 uppercase tracking-widest mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>{adventure.date ? format(new Date(adventure.date), 'MMMM d, yyyy') : 'No date'}</span>
                    </div>
                    
                    <h4 className="text-2xl font-light text-zinc-100 mb-4 group-hover:text-white transition-colors flex items-center gap-3">
                      {adventure.title}
                      <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </h4>
                    
                    <p className="text-zinc-400 font-light line-clamp-2 mb-6 leading-relaxed">
                      {adventure.description}
                    </p>
                    
                    {adventure.location && (
                      <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <MapPin className="w-4 h-4" />
                        <span>{adventure.location}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
