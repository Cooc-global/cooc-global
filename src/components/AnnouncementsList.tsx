import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  created_by: string;
  read_by: any;
}

interface AnnouncementsListProps {
  userId?: string;
  userRole?: string;
}

export const AnnouncementsList = ({ userId, userRole }: AnnouncementsListProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (!userId || userRole !== 'investor') return;

    try {
      const announcement = announcements.find(a => a.id === announcementId);
      if (!announcement) return;

      const readBy = Array.isArray(announcement.read_by) ? announcement.read_by : [];
      if (readBy.includes(userId)) return;

      const updatedReadBy = [...readBy, userId];

      const { error } = await supabase
        .from('announcements')
        .update({ read_by: updatedReadBy })
        .eq('id', announcementId);

      if (error) throw error;

      // Update local state
      setAnnouncements(prev => 
        prev.map(a => 
          a.id === announcementId 
            ? { ...a, read_by: updatedReadBy }
            : a
        )
      );
    } catch (error) {
      console.error('Error marking announcement as read:', error);
    }
  };

  const isRead = (announcement: Announcement) => {
    if (userRole === 'developer') return true;
    const readBy = Array.isArray(announcement.read_by) ? announcement.read_by : [];
    return readBy.includes(userId || '') || false;
  };

  const unreadCount = announcements.filter(a => !isRead(a)).length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Messages
            {unreadCount > 0 && userRole === 'investor' && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {announcements.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No messages yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    isRead(announcement) 
                      ? 'bg-background' 
                      : 'bg-muted/50 border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">
                      {announcement.title}
                    </h4>
                    {!isRead(announcement) && userRole === 'investor' && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    {announcement.message}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </div>
                    
                    {!isRead(announcement) && userRole === 'investor' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(announcement.id)}
                        className="text-xs h-auto p-1"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};