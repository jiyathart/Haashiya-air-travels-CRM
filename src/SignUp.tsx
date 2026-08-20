import React from 'react';
import { AuthCard } from './components/AuthCard';

export const SignUp: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#EDF1FC] flex items-center justify-center p-4">
      <AuthCard initialMode="signup" onSuccess={() => window.location.href = '/'} />
    </div>
  );
};

export default SignUp;
