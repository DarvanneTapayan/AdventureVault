import React, { useState, useCallback } from 'react';
import { useAuth } from './FirebaseProvider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const { user, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
    const newPreviews = acceptedFiles.map(file => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith('video') ? 'video' : 'image'
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [] as string[],
      'video/*': [] as string[]
    },
    multiple: true
  } as any);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!user || !title || files.length === 0) {
      toast.error('Please provide a title and at least one image/video');
      return;
    }

    setUploading(true);
    try {
      const mediaUrls = await Promise.all(
        files.map(async (file) => {
          const storageRef = ref(storage, `adventures/${user.uid}/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          return {
            url,
            type: file.type.startsWith('video') ? 'video' : 'image'
          };
        })
      );

      const adventureData = {
        userId: user.uid,
        authorName: profile?.displayName || user.displayName || 'Adventurer',
        authorPhoto: profile?.photoURL || user.photoURL || '',
        title,
        description,
        location,
        date,
        media: mediaUrls,
        tags: tags.split(',').map(t => t.trim()).filter(t => t !== ''),
        likesCount: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'adventures'), adventureData);
      
      toast.success('Adventure uploaded successfully!');
      resetForm();
      onClose();
    } catch (error) {
      console.error(error);
      handleFirestoreError(error, OperationType.CREATE, 'adventures');
      toast.error('Failed to upload adventure');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocation('');
    setDate('');
    setTags('');
    setFiles([]);
    setPreviews([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-light tracking-tight">New Adventure</DialogTitle>
          <DialogDescription className="text-zinc-500 font-light">
            Share your latest journey with the vault.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Title *</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Where did you go?"
              className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Location</label>
              <Input 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</label>
              <Input 
                type="date"
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell the story..."
              className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tags (comma separated)</label>
            <Input 
              value={tags} 
              onChange={(e) => setTags(e.target.value)}
              placeholder="hiking, mountain, summer"
              className="bg-zinc-900 border-zinc-800 focus:border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Media *</label>
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-zinc-100 bg-zinc-900' : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-zinc-600" />
                <p className="text-sm text-zinc-400">
                  {isDragActive ? 'Drop files here' : 'Drag & drop images or videos, or click to select'}
                </p>
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Max 10 files</p>
              </div>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-zinc-900 group">
                    {preview.type === 'video' ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="w-6 h-6 text-zinc-700" />
                      </div>
                    ) : (
                      <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button 
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-zinc-950/80 rounded-full text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={uploading} className="text-zinc-400 hover:text-zinc-100">
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={uploading || !title || files.length === 0}
            className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 rounded-full px-8"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Create Adventure'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
