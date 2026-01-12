import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useReports } from "../contexts/ReportContext";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

// Leaflet marker icon
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Helper: Check if step is complete
const isStepComplete = (step, formData) => {
  switch (step) {
    case 1:
      return formData.reportType && formData.title && formData.description;
    case 2:
      return formData.location && formData.lat && formData.lng;
    case 3:
      return true;
    default:
      return false;
  }
};

const ReportStepper = ({
  reportToEdit = null,
  onClose,
  defaultType = "",
  onReportAdded,
  onReportUpdated,
}) => {
  const { createReport, setReports, updateReport } = useReports();
  const {} = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reportType: defaultType || "",
    title: "",
    description: "",
    location: "",
    lat: "",
    lng: "",
    media: null,
  });

  useEffect(() => {
    if (reportToEdit) {
      setFormData({
        reportType:
          reportToEdit.type === "red-flag" ? "Red Flag" : "Intervention",
        title: reportToEdit.title,
        description: reportToEdit.description,
        location: reportToEdit.location || "",
        lat: reportToEdit.lat || "",
        lng: reportToEdit.lng || "",
        media: null,
      });
      setCurrentStep(1);
    } else if (defaultType) {
      setFormData((prev) => ({ ...prev, reportType: defaultType }));
    }
  }, [reportToEdit, defaultType]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleNext = () => {
    if (isStepComplete(currentStep, formData)) {
      nextStep();
    } else {
      toast.error("Please complete all fields in this step before proceeding.");
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!formData.reportType || !formData.title || !formData.description) {
      setIsSubmitting(false);
      return toast.error("Please complete all required fields.");
    }

    try {
      // Prepare payload
      const payload = {
        type: formData.reportType,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        media: formData.media,
      };

      // Use context function
      const savedReport = await createReport(payload);

      if (reportToEdit) {
        // --- EDIT MODE ---
        savedReport = await updateReport(reportToEdit.id, payload); // call context update
        toast.success("Report updated!");
        onReportUpdated?.(savedReport); // callback to refresh parent state
      } else {
        // --- CREATE MODE ---
        savedReport = await createReport(payload);
        toast.success("Report submitted!");
        onReportAdded?.(savedReport);
      }
      // Close stepper
      onClose?.();
      setFormData({
        reportType: defaultType || "",
        title: "",
        description: "",
        location: "",
        lat: "",
        lng: "",
        media: null,
      });

      // ⭐ Trigger parent callback after successful submission
      if (onReportAdded) onReportAdded(savedReport);
    } catch (err) {
      console.error("Submit report error:", err);
      toast.error(err.message || "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = ["Type & Description", "Location & Map", "Review & Submit"];

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-md max-h-[90vh] overflow-y-auto">
      {/* Step indicators */}
      <div className="flex justify-between mb-6">
        {steps.map((label, i) => {
          const complete = isStepComplete(i + 1, formData);
          const inProgress = currentStep === i + 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white ${
                  complete
                    ? "bg-teal-500"
                    : inProgress
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
              >
                {i + 1}
              </div>
              <p className="text-xs mt-1 text-center">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="space-y-4">
        {currentStep === 1 && (
          <div className="space-y-4 p-4 bg-white border rounded-md">
            <div className="flex gap-6">
              {["Red Flag", "Intervention"].map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type}
                    checked={formData.reportType === type}
                    onChange={(e) =>
                      setFormData({ ...formData, reportType: e.target.value })
                    }
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-gray-700 font-medium">{type}</span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Report Title
              </label>
              <input
                type="text"
                placeholder="Enter report title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="border border-gray-300 p-3 rounded-md w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                placeholder="Provide a detailed account..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="border border-gray-300 p-3 rounded-md w-full h-36 resize-y"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="p-4 bg-white border rounded-md flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="border p-2 rounded w-full"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Latitude"
                  value={formData.lat}
                  onChange={(e) =>
                    setFormData({ ...formData, lat: e.target.value })
                  }
                  className="border p-2 rounded w-1/2"
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={formData.lng}
                  onChange={(e) =>
                    setFormData({ ...formData, lng: e.target.value })
                  }
                  className="border p-2 rounded w-1/2"
                />
              </div>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) =>
                  setFormData({ ...formData, media: e.target.files?.[0] })
                }
                className="border p-2 rounded"
              />
              {formData.media && (
                <div className="mt-2">
                  {formData.media.type.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(formData.media)}
                      alt="preview"
                      className="w-full h-48 object-cover rounded"
                    />
                  ) : (
                    <video
                      src={URL.createObjectURL(formData.media)}
                      controls
                      className="w-full h-48 object-cover rounded"
                    />
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 h-64 md:h-auto">
              <MapContainer
                center={[
                  parseFloat(formData.lat) || 0,
                  parseFloat(formData.lng) || 0,
                ]}
                zoom={13}
                scrollWheelZoom={false}
                className="w-full h-full rounded"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker
                  position={[
                    parseFloat(formData.lat) || 0,
                    parseFloat(formData.lng) || 0,
                  ]}
                  icon={markerIcon}
                >
                  <Popup>{formData.location || "No Location"}</Popup>
                </Marker>
              </MapContainer>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="p-4 bg-white border rounded-md space-y-2">
            <p>
              <strong>Type:</strong> {formData.reportType}
            </p>
            <p>
              <strong>Title:</strong> {formData.title}
            </p>
            <p>
              <strong>Description:</strong> {formData.description}
            </p>
            <p>
              <strong>Location:</strong> {formData.location}
            </p>
            <p>
              <strong>Coordinates:</strong> {formData.lat}, {formData.lng}
            </p>
            {formData.media && (
              <>
                {formData.media.type.startsWith("image/") ? (
                  <img
                    src={URL.createObjectURL(formData.media)}
                    alt="media"
                    className="w-full h-48 object-cover rounded"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(formData.media)}
                    controls
                    className="w-full h-48 object-cover rounded"
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
      {/* Navigation */}
      <div className="flex justify-between mt-4">
        {currentStep > 1 && (
          <button onClick={prevStep} className="px-4 py-2 rounded bg-gray-300">
            Back
          </button>
        )}
        {currentStep < 3 && (
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded bg-blue-500 text-white ml-auto"
          >
            Next
          </button>
        )}
        {currentStep === 3 && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded text-white ml-auto ${
              isSubmitting ? "bg-teal-300 cursor-not-allowed" : "bg-teal-500"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportStepper;
