import { useChatStore } from '../store/useChatStore';

export default function ActiveTabSwitch() {
  const { activeTab, setActiveTab } = useChatStore();

  return (
    <div className="flex bg-slate-700/50 p-2 m-4 rounded-lg gap-2">
      <button
        onClick={() => setActiveTab('chats')}
        className={`flex-1 px-4 py-2 rounded transition-colors ${
          activeTab === 'chats'
            ? 'bg-blue-600 text-white'
            : 'bg-transparent text-slate-400 hover:text-white'
        }`}
      >
        Chats
      </button>
      <button
        onClick={() => setActiveTab('contacts')}
        className={`flex-1 px-4 py-2 rounded transition-colors ${
          activeTab === 'contacts'
            ? 'bg-blue-600 text-white'
            : 'bg-transparent text-slate-400 hover:text-white'
        }`}
      >
        Contacts
      </button>
    </div>
  );
}
