import { useChatStore } from '../store/useChatStore';

export default function ContactList() {
  const { contacts, selectedUser, setSelectedUser } = useChatStore();

  return (
    <div className="space-y-2">
      {contacts && contacts.length > 0 ? (
        contacts.map((contact) => (
          <div
            key={contact._id}
            onClick={() => setSelectedUser(contact)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedUser?._id === contact._id
                ? 'bg-blue-600/30 border border-blue-500'
                : 'hover:bg-slate-700/50'
            }`}
          >
            <div className="flex items-center gap-3">
              {contact.profilePic && (
                <img
                  src={contact.profilePic}
                  alt={contact.fullName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-medium truncate">{contact.fullName}</h4>
                <p className="text-xs text-slate-400 truncate">{contact.email}</p>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-slate-400 text-center py-8">No contacts available</p>
      )}
    </div>
  );
}
