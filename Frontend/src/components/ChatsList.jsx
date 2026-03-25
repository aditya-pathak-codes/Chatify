import { useChatStore } from '../store/useChatStore';

export default function ChatsList() {
  const { users, selectedUser, setSelectedUser } = useChatStore();

  return (
    <div className="space-y-2">
      {users && users.length > 0 ? (
        users.map((user) => (
          <div
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedUser?._id === user._id
                ? 'bg-blue-600/30 border border-blue-500'
                : 'hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {user.profilePic && (
                <img
                  src={user.profilePic}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{user.fullName}</h4>
                <p className="text-xs text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-slate-400 text-center py-8">No chats yet</p>
      )}
    </div>
  );
}
