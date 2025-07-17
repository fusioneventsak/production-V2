import React from 'react';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Full screen overlay - covers everything */}
      <div 
        className="fixed inset-0 z-[99999] bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal container - positioned above overlay */}
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
        {/* Modal content */}
        <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-700 shadow-xl rounded-2xl flex flex-col pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h3 className="text-2xl font-bold text-white">Privacy Policy</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6 text-gray-300">
              <p className="text-sm text-gray-400">Last Updated: July 1, 2025</p>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">1. Introduction</h4>
                <p>
                  Welcome to PhotoSphere ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and share information about you when you use our services.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">2. Information We Collect</h4>
                <p>
                  <strong>Account Information:</strong> When you register, we collect your email address and password.
                </p>
                <p>
                  <strong>User Content:</strong> We collect and store the photos and other content you upload to our platform.
                </p>
                <p>
                  <strong>Usage Information:</strong> We collect information about how you interact with our services, including access times, pages viewed, and the routes by which you access our services.
                </p>
                <p>
                  <strong>Device Information:</strong> We collect information about the device you use to access our services, including hardware model, operating system, and browser type.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">3. How We Use Your Information</h4>
                <p>We use your information to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, security alerts, and support messages</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our services</li>
                  <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                  <li>Personalize and improve the services</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">4. User-Generated Content and Photos</h4>
                <p>
                  Our platform allows users to upload and share photos. Please note:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You retain ownership rights to the content you upload</li>
                  <li>By uploading content, you grant us a license to use, store, and share that content in connection with providing our services</li>
                  <li>We do not monitor or control what users upload, and we are not responsible for the content of user uploads</li>
                  <li>We are not liable for any misuse of photos or other content uploaded to our platform</li>
                  <li>We reserve the right to remove any content that violates our terms of service or that we determine is otherwise objectionable</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">5. Sharing Your Information</h4>
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Service providers who perform services on our behalf</li>
                  <li>Other users, when you share content publicly on our platform</li>
                  <li>Law enforcement or other third parties, when required by law or to protect our rights</li>
                  <li>In connection with a business transaction, such as a merger, sale of assets, or bankruptcy</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">6. Data Security</h4>
                <p>
                  We implement reasonable security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">7. Your Rights</h4>
                <p>
                  Depending on your location, you may have certain rights regarding your personal information, such as the right to access, correct, or delete your data. To exercise these rights, please contact us at privacy@photosphere.com.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">8. Children's Privacy</h4>
                <p>
                  Our services are not intended for children under 13, and we do not knowingly collect information from children under 13. If we learn we have collected information from a child under 13, we will delete that information.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">9. Changes to This Privacy Policy</h4>
                <p>
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">10. Contact Us</h4>
                <p>
                  If you have any questions about this privacy policy, please contact us at privacy@photosphere.com.
                </p>
              </section>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicyModal;