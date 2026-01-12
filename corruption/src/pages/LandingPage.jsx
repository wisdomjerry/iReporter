import React from "react";
import { useNavigate } from "react-router-dom";
import { Shield, MapPin, Camera, Bell, FileText, Users } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Red Flag Reports",
      description: "Report corruption incidents, bribery, and misuse of public funds with evidence and location data."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Intervention Requests",
      description: "Request government intervention for infrastructure issues like bad roads, collapsed bridges, and flooding."
    },
    {
      icon: <MapPin className="w-8 h-8" />,
      title: "Geolocation Tracking",
      description: "Add precise location coordinates to your reports and visualize incidents on interactive maps."
    },
    {
      icon: <Camera className="w-8 h-8" />,
      title: "Media Evidence",
      description: "Upload images and videos to support your claims and provide compelling evidence."
    },
    {
      icon: <Bell className="w-8 h-8" />,
      title: "Real-time Updates",
      description: "Receive email and SMS notifications when administrators update the status of your reports."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Anonymous",
      description: "Your reports are secure and you can choose to remain anonymous while still tracking progress."
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Create Account",
      description: "Sign up for a free account to start reporting incidents and tracking their progress."
    },
    {
      number: "2",
      title: "Submit Report",
      description: "Create detailed reports with location data, evidence, and clear descriptions of the incident."
    },
    {
      number: "3",
      title: "Track Progress",
      description: "Monitor the status of your reports and receive notifications when actions are taken."
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <h1 
            className="text-2xl font-bold text-red-600 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            iReporter
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-600 hover:text-white transition duration-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/registration")} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-red-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Report Corruption.<br />Demand Action.
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                iReporter empowers citizens to report corruption incidents and request government interventions 
                for infrastructure issues. Make your voice heard and drive positive change in your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() => navigate("/registration")} // Changed to navigate to signup
                  className="px-8 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition duration-200 shadow-lg"
                >
                  Start Reporting
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="px-8 py-3 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition duration-200"
                >
                  Sign In
                </button>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <img 
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?ixlib=rb-4.1.0&auto=format&fit=crop&w=1000&q=80" 
                alt="Citizen Reporting" 
                className="rounded-2xl shadow-2xl max-w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              iReporter Platform
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful Features for Civic Engagement<br />
              Our platform provides comprehensive tools to report incidents, track progress, and ensure accountability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300 border border-gray-100"
              >
                <div className="text-red-600 mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <p className="text-lg text-gray-600">
              Simple steps to make a difference in your community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="text-center"
              >
                <div className="w-16 h-16 bg-red-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {step.number}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-4">
                  {step.title}
                </h4>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h3>
          <p className="text-xl text-red-100 mb-8">
            Join thousands of citizens who are using iReporter to fight corruption and improve their communities
          </p>
          <button
            onClick={() => navigate("/registration")}
            className="px-8 py-4 bg-white text-red-500 rounded-lg font-bold text-lg hover:bg-white transition duration-200 shadow-lg"
          >
            Get Started Today
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <h4 className="text-2xl font-bold text-white">iReporter</h4>
              <p className="text-gray-400">
                Empowering citizens to report corruption and demand government accountability.
              </p>
            </div>

            {/* Platform */}
            <div className="space-y-3">
              <h5 className="font-semibold text-white">Platform</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer transition">Features</li>
                <li className="hover:text-white cursor-pointer transition">How it Works</li>
                <li className="hover:text-white cursor-pointer transition">Security</li>
              </ul>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h5 className="font-semibold text-white">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer transition">Help Center</li>
                <li className="hover:text-white cursor-pointer transition">Contact Us</li>
                <li className="hover:text-white cursor-pointer transition">Community</li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-3">
              <h5 className="font-semibold text-white">Legal</h5>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white cursor-pointer transition">Privacy Policy</li>
                <li className="hover:text-white cursor-pointer transition">Terms of Service</li>
                <li className="hover:text-white cursor-pointer transition">Cookie Policy</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2025 iReporter. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;