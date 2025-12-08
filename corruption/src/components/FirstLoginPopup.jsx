import React from "react";
import { PlusCircle } from "lucide-react";

const FirstLoginPopup = ({ onAddReport }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full text-center">
        <PlusCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-3">Create Your First Report</h2>
        <p className="text-gray-600 mb-6">
          Welcome! It looks like you haven’t created any reports yet.  
          Tap below to submit your first red-flag or intervention report.
        </p>

        <button
          className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg hover:bg-red-700"
          onClick={onAddReport}
        >
          Add Report
        </button>
      </div>
    </div>
  );
};

export default FirstLoginPopup;
