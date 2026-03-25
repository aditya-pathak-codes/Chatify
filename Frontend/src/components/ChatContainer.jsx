import { useChatStore } from '../store/useChatStore';

export default function ChatContainer() {
  const { messages, selectedUser } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-700 flex items-center gap-3 bg-slate-800/30">
        {selectedUser?.profilePic && (
          <img
            src={selectedUser.profilePic}
            alt={selectedUser.fullName}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="text-white font-semibold">{selectedUser?.fullName}</h3>
          <p className="text-xs text-slate-400">{selectedUser?.email}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.senderId === selectedUser?._id ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === selectedUser?._id
                    ? 'bg-slate-700 text-white'
                    : 'bg-blue-600 text-white'
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-400 text-center py-8">No messages yet</p>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/30">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full px-4 py-2 rounded-lg bg-slate-700 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
    </div>
  );
}
