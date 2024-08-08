import React from 'react';
import { motion } from 'framer-motion';

interface ProfileProps {
  chartFullyRendered: boolean;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

const Profile: React.FC<ProfileProps> = ({ chartFullyRendered, user }) => {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white p-4">
        <div className="w-full max-w-md text-center">
          <h3 className="text-xl font-semibold mb-4">User Information</h3>
          <p className="mb-2"><strong>Name:</strong> {user.name}</p>
          <p className="mb-2"><strong>Email:</strong> {user.email}</p>
        </div>
      </div>
    );
  };