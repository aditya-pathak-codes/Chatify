import { Routes, Route } from 'react-router';
import ChatPage from './pages/ChatPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignUpPage from './pages/SignUpPage.jsx';
import { use } from 'react';
import { useEffect } from 'react';

function App() {
  const{checkAuth, isCheckingAuth}= useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  console.log({authUser});

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-900 relative flex items-center justify-center p-4 overflow-hidden">

      {/* DECORATORS - GRID BG AND GLOW SHAPES */}

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

      {/* Pink Glow - Top Left */}
      <div className="absolute top-0 -left-4 size-96 bg-pink-500 opacity-20 blur-[100px] pointer-events-none " />

      {/* Cyan Glow - Bottom Right */}
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px] pointer-events-none" />

      

      <Routes> 
       <Route path="/" element= {authUser ? <ChatPage /> : <Navigate to="/login" />} />
       <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
       <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
      </Routes>


    </div>
  );
}

export default App
