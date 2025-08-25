import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send } from 'lucide-react';

interface AnnouncementDialogProps {
  userRole?: string;
  onAnnouncementSent?: () => void;
}

export const AnnouncementDialog = ({ userRole, onAnnouncementSent }: AnnouncementDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Only show for developers
  if (userRole !== 'developer') {
    return null;
  }

  const handleSendAnnouncement = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: title.trim(),
          message: message.trim(),
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Announcement sent to all investors",
        variant: "default"
      });

      // Reset form and close dialog
      setTitle('');
      setMessage('');
      setIsOpen(false);
      
      // Trigger refresh of announcements list
      onAnnouncementSent?.();
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: "Error",
        description: "Failed to send announcement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Send Message to Investors
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send Announcement to All Investors
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-title">Title</Label>
            <Input
              id="announcement-title"
              placeholder="Enter announcement title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/100 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="announcement-message">Message</Label>
            <Textarea
              id="announcement-message"
              placeholder="Type your message to all investors here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {message.length}/1000 characters
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendAnnouncement}
              disabled={isLoading || !title.trim() || !message.trim()}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isLoading ? 'Sending...' : 'Send to All Investors'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};