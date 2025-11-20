import React from 'react';
import { type StudentProfile } from '@/types';

interface ProfilePageProps {
    profile: StudentProfile;
    onEdit: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ profile, onEdit }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">My Profile</h2>
                    <p className="text-slate-400">Manage your personal information and goals</p>
                </div>
                <button
                    onClick={onEdit}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition-colors"
                >
                    Edit Profile
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Info */}
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Name</label>
                                <p className="text-slate-200">{profile.name}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Grade</label>
                                <p className="text-slate-200">{profile.grade}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Age</label>
                                <p className="text-slate-200">{profile.age}</p>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Gender</label>
                                <p className="text-slate-200 capitalize">{profile.gender}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Academic */}
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Academic Profile</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Subjects</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.subjects.map((sub) => (
                                    <span key={sub} className="px-2 py-1 rounded-md bg-slate-800 text-slate-300 text-sm">
                                        {sub}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Learning Style</label>
                            <p className="text-slate-200 capitalize">{profile.learningStyle}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Academic Goals</label>
                            <p className="text-slate-200">{profile.academicGoals}</p>
                        </div>
                    </div>
                </div>

                {/* Goals & Aspirations */}
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 md:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Goals & Aspirations</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Dream Job</label>
                            <p className="text-slate-200">{profile.dreamJob}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Career Aspirations</label>
                            <p className="text-slate-200">{profile.careerAspirations}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Role Models</label>
                            <p className="text-slate-200">{profile.roleModels}</p>
                        </div>
                    </div>
                    <div className="mt-4 grid md:grid-cols-3 gap-6">
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Current Goals</label>
                            <p className="text-slate-200">{profile.currentGoals?.join(', ') || 'None'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Short Term Goals</label>
                            <p className="text-slate-200">{profile.shortTermGoals?.join(', ') || 'None'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Long Term Goals</label>
                            <p className="text-slate-200">{profile.longTermGoals?.join(', ') || 'None'}</p>
                        </div>
                    </div>
                </div>

                {/* Interests */}
                <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 md:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-4">Interests & Hobbies</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Interests</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.interests.map((item) => (
                                    <span key={item} className="px-2 py-1 rounded-md bg-indigo-900/30 text-indigo-300 text-sm border border-indigo-500/30">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Hobbies</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.hobbies.map((item) => (
                                    <span key={item} className="px-2 py-1 rounded-md bg-emerald-900/30 text-emerald-300 text-sm border border-emerald-500/30">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase">Sports</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {profile.sportsActivities.map((item) => (
                                    <span key={item} className="px-2 py-1 rounded-md bg-orange-900/30 text-orange-300 text-sm border border-orange-500/30">
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
