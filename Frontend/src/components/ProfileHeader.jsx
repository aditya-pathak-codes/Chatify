import { useAuthStore } from '../store/useAuthStore';

export default function ProfileHeader() {
  const { authUser, logout } = useAuthStore();

  return (
    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {authUser?.profilePic && (
          <img
            src={authUser.profilePic}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover"
          />
        )}
        <div>
          <h3 className="text-white font-semibold">{authUser?.fullName}</h3>
          <p className="text-xs text-slate-400">{authUser?.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="text-slate-400 hover:text-red-400 transition-colors"
        title="Logout"
      >
        ✕
      </button>
    </div>
  );
}
