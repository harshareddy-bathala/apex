import React from 'react';
import {
  BookOpen,
  Calendar,
  Edit3,
  Mail,
  MapPin,
  Moon,
  MoreHorizontal,
  Settings as SettingsIcon,
  Sun,
  Target,
  Users,
  Zap,
  GraduationCap
} from 'lucide-react';

import { useAuth } from '@/common/hooks/useAuth';
import { useTheme } from '@/common/context/ThemeContext';
import type { StudentProfile } from '@/types';

interface ProfilePageProps {
  profile: StudentProfile;
  onEditProfile: () => void;
  onEditGoals: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onEditProfile, onEditGoals }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const firstName = profile.name.split(' ')[0] ?? profile.name;
  
  // Fallbacks
  const bio = profile.bio?.trim() || null;
  const hobbyList = profile.hobbies?.filter(Boolean) ?? [];
  const interestList = profile.interests?.filter(Boolean) ?? [];

  const stats = [
    { label: 'Followers', value: profile.followers ?? 0, icon: Users },
    { label: 'Notes', value: profile.notesShared ?? 0, icon: BookOpen },
    { label: 'Subjects', value: profile.subjects.length, icon: Zap },
  ];

  const formatNumber = (value: number) => new Intl.NumberFormat('en-US', { notation: "compact" }).format(value);

  return (
    <div className="animate-in fade-in duration-500 w-full max-w-6xl mx-auto pb-10">
      
      
      <div className="relative mb-20">
      
        <div className="h-48 w-full rounded-2xl  bg-[var(--text-primary)]  relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          
      
          <div className="absolute top-4 right-4 flex gap-2 px-4">
             <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-[var(--bg-card)] text-[var(--text-primary)] backdrop-blur-md border border-white/20  transition"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            {/* <button
              onClick={() => window.location.href = '/settings'}
              className="p-2 rounded-full dark:bg-black dark:text-white bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition"
              title="Settings"
            >
              <SettingsIcon size={18} />
            </button> */}
            <ActionButton onClick={onEditGoals} icon={<Target size={16} />} label="Goals" />
            <ActionButton onClick={onEditProfile} icon={<Edit3 size={16} />} label="Edit Profile"  />
          </div>
        </div>

        
        <div className="absolute top-10 left-0 right-0 px-8 flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            
            <div className="h-32 w-32 rounded-full border-4 border-[var(--bg-card)] bg-[var(--bg-secondary)] flex items-center justify-center shadow-lg overflow-hidden relative z-10">
               
               <span className="text-4xl font-display font-bold text-[var(--text-secondary)]">
                 {firstName.charAt(0)}
               </span>
            </div>
            
            
            <div className=" relative z-10 flex flex-col gap-1">
              <h1 className="text-3xl font-display font-bold text-[var(--bg-card)]">{profile.name}</h1>
              
              <p className="text-[var(--bg-tertiary)]  font-medium inline-flex gap-2 items-center">  <Mail size={16}/> {user?.email }</p>
              
              <p className="text-[var(--bg-tertiary)]  font-medium inline-flex gap-2 items-center "> <GraduationCap size={16}/> Grade {profile.grade}</p>
            </div>
          </div>


          <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center py-2">
                <div className="text-xl font-bold text-[var(--text-primary)]">{formatNumber(stat.value)}</div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
        
{/*         
        <div className="lg:col-span-4 space-y-6">
          
        
        
          <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm">
             <h3 className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)] mb-6 font-semibold">About</h3>
             
             <div className="space-y-5">
               <InfoItem icon={<Mail size={16}/>} label="Email" value={user?.email || 'No email linked'} />
               <InfoItem icon={<GraduationCap size={16}/>} label="Class" value={`Grade ${profile.grade}`} />
               <InfoItem icon={<Calendar size={16}/>} label="Joined" value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Unknown'} />
             </div>
          </div>

        </div> */}

        
        <div className="lg:col-span-8 space-y-8">
          
        
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display font-semibold text-[var(--text-primary)]">Biography</h2>
            </div>
            
            <div className={`p-6 rounded-2xl border ${bio ? 'bg-[var(--bg-card)] border-[var(--border-subtle)]' : 'border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/30'}`}>
               {bio ? (
                 <p className="leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap">{bio}</p>
               ) : (
                 <div className="text-center py-6">
                   <p className="text-[var(--text-muted)] text-sm mb-3">Your bio is empty. Tell mentors what drives you.</p>
                   <button onClick={onEditProfile} className="text-sm text-[var(--accent-primary)] font-semibold hover:underline">
                     Write a bio
                   </button>
                 </div>
               )}
            </div>
          </section>

        
          <section>
            <h2 className="text-xl font-display font-semibold text-[var(--text-primary)] mb-4">Interests & Skills</h2>
            <div className="p-6 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              
        
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Hobbies</h3>
                <div className="flex flex-wrap gap-2">
                  {hobbyList.length > 0 ? (
                    hobbyList.map(hobby => <Badge key={hobby}>{hobby}</Badge>)
                  ) : (
                    <span className="text-sm text-[var(--text-muted)] italic">No hobbies added.</span>
                  )}
                </div>
              </div>

        
              <div>
                <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Academic Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interestList.length > 0 ? (
                    interestList.map(item => <Badge key={item} variant="accent">{item}</Badge>)
                  ) : (
                    <span className="text-sm text-[var(--text-muted)] italic">No interests added.</span>
                  )}
                </div>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
};



const ActionButton = ({ icon, label, onClick, primary = false }: { icon: React.ReactNode, label: string, onClick: () => void, primary?: boolean }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm
      ${primary 
        ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--text-primary)]/90' 
        : 'bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
      }
    `}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-center gap-3">
    <div className="text-[var(--text-muted)]">{icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'accent' }) => {
  const styles = variant === 'accent' 
    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]/20'
    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-subtle)]';

  return (
    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${styles}`}>
      {children}
    </span>
  );
};

export default ProfilePage;