import React, { useEffect, useState } from 'react';
import { useAuth } from './FirebaseProvider';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Gallery } from './Gallery';
import { MapPin, Calendar, Edit2, Check, X, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from './ui/skeleton';

interface ProfileProps {
  onSelect: (id: string) => void;
  userId?: string; // If provided, view this user's profile. If not, view current user's.
}

export const Profile: React.FC<ProfileProps> = ({ onSelect, userId }) => {
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const targetUserId = userId || user?.uid;
  const isOwnProfile = user?.uid === targetUserId;

  useEffect(() => {
    if (!targetUserId) return;

    if (isOwnProfile && myProfile) {
      setProfile(myProfile);
      setEditName(myProfile.displayName || '');
      setEditBio(myProfile.bio || '');
      setLoading(false);
      return;
    }

    const profileRef = doc(db, 'users', targetUserId);
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
        setEditName(docSnap.data().displayName || '');
        setEditBio(docSnap.data().bio || '');
      } else {
        toast.error('Profile not found');
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${targetUserId}`);
    });

    return () => unsubscribe();
  }, [targetUserId, isOwnProfile, myProfile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: editName,
        bio: editBio
      });
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 space-y-12">
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="w-32 h-32 rounded-full bg-zinc-900" />
          <Skeleton className="h-10 w-48 bg-zinc-900" />
          <Skeleton className="h-20 w-full max-w-md bg-zinc-900" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl bg-zinc-900" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="py-12">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center mb-16">
        <div className="relative mb-6">
          <Avatar className="w-32 h-32 border-2 border-zinc-800">
            <AvatarImage src={profile.photoURL} />
            <AvatarFallback className="bg-zinc-900 text-zinc-500 text-2xl">
              {profile.displayName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {isOwnProfile && !isEditing && (
            <button className="absolute bottom-0 right-0 p-2 bg-zinc-100 text-zinc-950 rounded-full shadow-lg hover:bg-zinc-200 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="w-full max-w-md space-y-4">
            <Input 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Display Name"
              className="bg-zinc-900 border-zinc-800 text-center text-xl h-12"
            />
            <Textarea 
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell us about your adventures..."
              className="bg-zinc-900 border-zinc-800 text-center min-h-[100px]"
            />
            <div className="flex justify-center gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="text-zinc-400"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving || !editName.trim()}
                className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-full px-8"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-4xl font-light tracking-tighter mb-4 text-zinc-100">{profile.displayName}</h2>
            <p className="text-zinc-400 font-light max-w-md mx-auto mb-8 leading-relaxed">
              {profile.bio || 'No bio yet. This adventurer is busy exploring the world.'}
            </p>
            
            <div className="flex items-center gap-6 text-sm text-zinc-500 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {profile.createdAt ? new Date(profile.createdAt.toDate()).toLocaleDateString() : 'recently'}</span>
              </div>
              {isOwnProfile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="rounded-full border-zinc-800 text-zinc-400 hover:text-zinc-100"
                >
                  <Edit2 className="w-3 h-3 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </>
        )}
      </div>

      {/* User's Adventures */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <h3 className="text-xl font-light tracking-tight">Adventures</h3>
          <span className="text-xs text-zinc-500 uppercase tracking-widest font-medium">Collection</span>
        </div>
        
        {/* We reuse the Gallery component but we should ideally filter it by userId */}
        {/* For now, I'll modify Gallery to accept a userId prop and filter if present */}
        <Gallery onSelect={onSelect} userId={targetUserId} />
      </div>
    </div>
  );
};
