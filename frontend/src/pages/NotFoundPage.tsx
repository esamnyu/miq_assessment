import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md text-center bg-white rounded-lg shadow-md overflow-hidden dark:bg-gray-800">
        <div className="p-6">
          <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-400">404</h1>
          <h2 className="text-2xl font-semibold mt-2 text-gray-800 dark:text-gray-200">
            Page Not Found
          </h2>
        </div>
        <div className="px-6 pb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Oops! The page you are looking for does not exist, might have been removed,
            or is temporarily unavailable.
          </p>
          <Link to="/">
            <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
              Go to Homepage
            </button>
          </Link>
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            Error Code: {new Date().getFullYear()}-PNF
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;