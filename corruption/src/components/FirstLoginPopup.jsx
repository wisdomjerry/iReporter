import React, { useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";

const FirstLoginPopup = ({ onAddReport }) => {
  const buttonRef = useRef(null);

  // Auto-focus the Continue button
  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[90%] max-w-md text-center">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2 text-red-600">
          Welcome to iReporter!
        </h2>
        <p className="text-gray-700 mb-6">
          Thank you for joining. Get started by creating your first report.
        </p>

        <button
          ref={buttonRef}
          onClick={onAddReport}
          className="w-full py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default FirstLoginPopup;
