import React from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { ChevronRight, Globe } from 'lucide-react';

interface HeroProps {
  onExplore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore }) => {
  return (
    <div className="relative h-[80vh] w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=2000" 
          alt="Adventure Hero"
          className="w-full h-full object-cover opacity-40"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/40 to-zinc-950" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100/10 border border-zinc-100/20 text-xs font-medium text-zinc-300 backdrop-blur-sm">
              <Globe className="w-3 h-3" />
              <span>Document your journey across the globe</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-light tracking-tighter mb-6 leading-tight">
            Every adventure <br />
            <span className="italic font-serif">deserves a vault.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto mb-10 leading-relaxed">
            A minimal space to preserve your most meaningful travels. 
            Upload, organize, and share your stories with the world.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={onExplore}
              className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-full px-8 h-12 text-base font-medium"
            >
              Explore Timeline
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-900 rounded-full px-8 h-12 text-base font-medium"
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
        <span className="text-[10px] uppercase tracking-[0.3em] font-medium">Scroll to explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-zinc-100 to-transparent" />
      </div>
    </div>
  );
};
