import React from 'react';
import { X } from 'lucide-react';

const WelcomeModal = ({ onStartReport, onClose }) => {
  return (
    // Backdrop for the modal
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
      
      {/* Modal Content Box */}
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
          aria-label="Close welcome screen"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <h2 className="text-3xl font-bold text-indigo-700 mb-4">
          Welcome to the Anti-Corruption Platform!
        </h2>

        {/* Body Content */}
        <p className="text-gray-600 mb-6">
          Thank you for joining the fight against corruption. Your reports are vital to our mission.
        </p>

        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
            <p className="font-semibold text-indigo-800">Ready to make your first report?</p>
            <p className="text-sm text-indigo-600 mt-1">
                It only takes a few quick steps.
            </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onStartReport}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md"
        >
          Add First Report Now
        </button>
        
      </div>
    </div>
  );
};

export default WelcomeModal;