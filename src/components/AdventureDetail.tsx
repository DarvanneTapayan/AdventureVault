import React, { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, increment, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './FirebaseProvider';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { 
  ChevronLeft, 
  MapPin, 
  Calendar, 
  Heart, 
  MessageSquare, 
  Share2, 
  MoreHorizontal,
  Send,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';
import { motion, AnimatePresence } from 'motion/react';

interface AdventureDetailProps {
  id: string;
  onBack: () => void;
  onNavigateToProfile: (userId: string) => void;
}

export const AdventureDetail: React.FC<AdventureDetailProps> = ({ id, onBack, onNavigateToProfile }) => {
  const { user, profile } = useAuth();
  const [adventure, setAdventure] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const adventureRef = doc(db, 'adventures', id);
    
    const unsubscribeAdventure = onSnapshot(adventureRef, (docSnap) => {
      if (docSnap.exists()) {
        setAdventure({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error('Adventure not found');
        onBack();
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `adventures/${id}`);
    });

    const commentsRef = collection(db, 'adventures', id, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'desc'));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (user) {
      const likeRef = doc(db, 'adventures', id, 'likes', user.uid);
      const unsubscribeLike = onSnapshot(likeRef, (docSnap) => {
        setIsLiked(docSnap.exists());
      });
      return () => {
        unsubscribeAdventure();
        unsubscribeComments();
        unsubscribeLike();
      };
    }

    return () => {
      unsubscribeAdventure();
      unsubscribeComments();
    };
  }, [id, user]);

  const handleLike = async () => {
    if (!user) {
      toast.error('Please sign in to like adventures');
      return;
    }

    const likeRef = doc(db, 'adventures', id, 'likes', user.uid);
    const adventureRef = doc(db, 'adventures', id);

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(adventureRef, { likesCount: increment(-1) });
      } else {
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(adventureRef, { likesCount: increment(1) });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update like');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const commentsRef = collection(db, 'adventures', id, 'comments');
      await addDoc(commentsRef, {
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Adventurer',
        userPhoto: profile?.photoURL || user.photoURL || '',
        text: newComment.trim(),
        createdAt: serverTimestamp()
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      console.error(error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'adventures', id, 'comments', commentId));
      toast.success('Comment deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="py-12 space-y-8">
        <Skeleton className="h-10 w-24 bg-zinc-900" />
        <Skeleton className="aspect-video w-full rounded-3xl bg-zinc-900" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4 bg-zinc-900" />
          <Skeleton className="h-24 w-full bg-zinc-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="mb-8 text-zinc-400 hover:text-zinc-100 -ml-4"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to Explore
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          {/* Media Display */}
          <div className="space-y-4">
            {adventure.media.map((item: any, index: number) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-3xl overflow-hidden bg-zinc-900"
              >
                {item.type === 'video' ? (
                  <video 
                    src={item.url} 
                    controls 
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                ) : (
                  <img 
                    src={item.url} 
                    alt={`${adventure.title} - ${index}`} 
                    className="w-full h-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <h1 className="text-4xl font-light tracking-tight text-zinc-100">{adventure.title}</h1>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleLike}
                  className={`rounded-full border-zinc-800 ${isLiked ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'text-zinc-400'}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full border-zinc-800 text-zinc-400">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm text-zinc-500">
              {adventure.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{adventure.location}</span>
                </div>
              )}
              {adventure.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(adventure.date), 'MMMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{adventure.likesCount || 0} Likes</span>
              </div>
            </div>

            <p className="text-lg text-zinc-300 font-light leading-relaxed whitespace-pre-wrap">
              {adventure.description}
            </p>

            {adventure.tags && adventure.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-4">
                {adventure.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-full bg-zinc-900 text-zinc-400 text-xs border border-zinc-800">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-12">
          {/* Author Card */}
          <div className="p-6 rounded-3xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-12 h-12 border border-zinc-700">
                <AvatarImage src={adventure.authorPhoto} />
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  {adventure.authorName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-zinc-100">{adventure.authorName}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Adventurer</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full rounded-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              onClick={() => onNavigateToProfile(adventure.userId)}
            >
              View Profile
            </Button>
          </div>

          {/* Comments Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-zinc-100">
              <MessageSquare className="w-5 h-5" />
              <h3 className="font-medium">Comments ({comments.length})</h3>
            </div>

            {user ? (
              <form onSubmit={handleAddComment} className="relative">
                <Input 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 pr-12 h-12 rounded-2xl"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!newComment.trim() || submittingComment}
                  className="absolute right-1.5 top-1.5 w-9 h-9 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-zinc-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            ) : (
              <p className="text-sm text-zinc-500 text-center py-4 border border-dashed border-zinc-800 rounded-2xl">
                Sign in to join the conversation.
              </p>
            )}

            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence initial={false}>
                {comments.map((comment) => (
                  <motion.div 
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4 group"
                  >
                    <Avatar className="w-8 h-8 border border-zinc-800 flex-shrink-0">
                      <AvatarImage src={comment.userPhoto} />
                      <AvatarFallback className="bg-zinc-900 text-zinc-500 text-[10px]">
                        {comment.userName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-zinc-200">{comment.userName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-zinc-600 uppercase">
                            {comment.createdAt ? format(comment.createdAt.toDate(), 'MMM d') : '...'}
                          </span>
                          {(user?.uid === comment.userId || user?.uid === adventure.userId) && (
                            <button 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-zinc-400 font-light leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {comments.length === 0 && (
                <p className="text-sm text-zinc-600 font-light text-center py-8">
                  No comments yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
