// src/components/Chat/MembersList.jsx
import React from 'react';
import MemberItem from './MemberItem';

const MembersList = ({ members, groupId, title = 'الأعضاء' }) => {
    if (!members || members.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                لا يوجد أعضاء في هذه المجموعة
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">
                    {title} ({members.length})
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {members.map((member) => (
                    <MemberItem
                        key={member.id}
                        member={member}
                        groupId={groupId}
                    />
                ))}
            </div>
        </div>
    );
};

export default MembersList;