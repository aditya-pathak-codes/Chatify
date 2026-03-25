export default function NoConversationPlaceholder() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="text-xl font-semibold text-white mb-2">No conversation selected</h2>
        <p className="text-slate-400">
          Select a chat or contact from the list to start messaging
        </p>
      </div>
    </div>
  );
}
