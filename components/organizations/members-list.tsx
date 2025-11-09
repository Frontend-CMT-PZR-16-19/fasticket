'use client';

import { useState } from 'react';
import { updateMemberRole, removeOrganizationMember } from '@/lib/actions/organizations';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Member {
  id: string;
  role: 'organizer' | 'member';
  joined_at: string;
  profile: {
    id: string;
    fullname: string;
    avatar_url: string | null;
    bio: string | null;
  };
}

interface MembersListProps {
  members: Member[];
  organizationId: string;
  isOrganizer: boolean;
  currentUserId: string;
}

export function MembersList({ 
  members, 
  organizationId,
  isOrganizer,
  currentUserId 
}: MembersListProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleRoleChange(memberId: string, newRole: 'organizer' | 'member') {
    setLoading(memberId);
    const result = await updateMemberRole(memberId, newRole);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Rol güncellendi');
    }
    
    setLoading(null);
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    if (!confirm(`${memberName} organizasyondan çıkarılsın mı?`)) {
      return;
    }

    setLoading(memberId);
    const result = await removeOrganizationMember(memberId);
    
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Üye çıkarıldı');
    }
    
    setLoading(null);
  }

  if (members.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Henüz üye yok
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const isCurrentUser = member.profile.id === currentUserId;
        const initials = member.profile.fullname
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{member.profile.fullname}</p>
                  {isCurrentUser && (
                    <Badge variant="outline">Siz</Badge>
                  )}
                </div>
                {member.profile.bio && (
                  <p className="text-sm text-muted-foreground">{member.profile.bio}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Katılma: {new Date(member.joined_at).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={member.role === 'organizer' ? 'default' : 'secondary'}>
                {member.role === 'organizer' ? 'Yönetici' : 'Üye'}
              </Badge>

              {isOrganizer && !isCurrentUser && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading === member.id}
                    >
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {member.role === 'member' ? (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member.id, 'organizer')}
                      >
                        Yönetici Yap
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member.id, 'member')}
                      >
                        Üye Yap
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleRemoveMember(member.id, member.profile.fullname)}
                      className="text-destructive"
                    >
                      Çıkar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
