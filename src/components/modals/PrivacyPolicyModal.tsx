import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  // Create the modal content
  const modalContent = (
    <>
      {/* Full screen overlay - covers everything */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        style={{ 
          zIndex: 2147483647,  // Maximum possible z-index value
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
        onClick={onClose}
      />
      
      {/* Modal container - positioned above overlay */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none"
        style={{ 
          zIndex: 2147483647,  // Maximum possible z-index value
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      >
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
              <p className="text-sm text-gray-400">Last Updated: July 16, 2025</p>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">1. Introduction and Acceptance</h4>
                <p>
                  This Privacy Policy governs the collection, use, and disclosure of personal information by PhotoSphere Inc., a subsidiary of Fusion Events Inc. (collectively, "PhotoSphere," "Company," "we," "us," or "our") through the PhotoSphere platform and related services (the "Platform"). By accessing or using the Platform, you ("User," "you," or "your") acknowledge that you have read, understood, and agree to be bound by this Privacy Policy and consent to our collection, use, and disclosure of your information as described herein.
                </p>
                <p>
                  <strong>By using our Platform, you expressly consent to the collection, use, processing, and international transfer of your personal information in accordance with this Privacy Policy, even if such practices may differ from those in your jurisdiction.</strong>
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">2. Information We Collect</h4>
                <p>
                  We collect various types of information to provide, maintain, protect, and improve our Platform:
                </p>
                <p>
                  <strong>Account and Registration Information:</strong> Email address, password, profile information, billing details, and any other information you provide during registration or account management.
                </p>
                <p>
                  <strong>User Content and Photos:</strong> All photos, images, text, metadata, and other content you upload, share, or transmit through the Platform, including EXIF data, location information, timestamps, and technical specifications.
                </p>
                <p>
                  <strong>Usage and Analytics Data:</strong> Information about how you access and use the Platform, including IP addresses, browser type, device identifiers, operating system, access times, pages viewed, navigation patterns, search queries, feature usage, and interaction data.
                </p>
                <p>
                  <strong>Device and Technical Information:</strong> Hardware model, operating system version, unique device identifiers, mobile network information, browser fingerprints, screen resolution, and technical specifications.
                </p>
                <p>
                  <strong>Location Data:</strong> Precise and approximate location information derived from GPS, IP address, WiFi networks, cellular towers, and other location technologies.
                </p>
                <p>
                  <strong>Communications:</strong> Records of communications between you and PhotoSphere, including support tickets, feedback, and any other interactions.
                </p>
                <p>
                  <strong>Third-Party Information:</strong> Information we receive from third-party services, social media platforms, analytics providers, advertising networks, and other external sources.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">3. How We Use Your Information</h4>
                <p>We use collected information for various purposes, including but not limited to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing, operating, maintaining, and improving the Platform and our services</li>
                  <li>Processing transactions, payments, and billing</li>
                  <li>Creating and managing user accounts and profiles</li>
                  <li>Personalizing user experience and content recommendations</li>
                  <li>Developing new features, products, and services</li>
                  <li>Conducting analytics, research, and data analysis</li>
                  <li>Training and improving artificial intelligence and machine learning models</li>
                  <li>Marketing, advertising, and promotional activities</li>
                  <li>Communicating with users about services, updates, and notifications</li>
                  <li>Detecting, investigating, and preventing fraud, abuse, and illegal activities</li>
                  <li>Ensuring platform security and protecting against cyber threats</li>
                  <li>Complying with legal obligations and enforcing our terms</li>
                  <li>Any other purpose disclosed at the time of collection or with your consent</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">4. Photo Content and Biometric Information</h4>
                <p>
                  <strong>Photo Processing:</strong> Photos uploaded to the Platform may be processed, analyzed, and modified using automated systems, including but not limited to face detection, object recognition, content analysis, and enhancement algorithms.
                </p>
                <p>
                  <strong>Biometric Data:</strong> Our systems may extract and process biometric information from photos, including facial geometry, distinctive features, and other biometric identifiers for content organization, security, and service improvement purposes.
                </p>
                <p>
                  <strong>Content Rights:</strong> You acknowledge that photos uploaded to public Collages may be viewed, downloaded, or screenshot by other users. We cannot control how other users use or distribute content they access through the Platform.
                </p>
                <p>
                  <strong>Metadata Extraction:</strong> We automatically extract and process metadata from uploaded photos, including EXIF data, location information, camera settings, and timestamps.
                </p>
                <p>
                  <strong>Content Moderation:</strong> All uploaded content may be subject to automated and human content moderation, including scanning for inappropriate content, copyright violations, and compliance with our policies.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">5. Information Sharing and Disclosure</h4>
                <p>We may share your information in the following circumstances:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Public Platform Features:</strong> Content you upload to public Collages is visible to other users and may be accessed, viewed, or downloaded by anyone with access to the Collage</li>
                  <li><strong>Service Providers:</strong> Third-party vendors, contractors, and service providers who perform services on our behalf, including cloud hosting, analytics, payment processing, and customer support</li>
                  <li><strong>Business Partners:</strong> Affiliated companies, partners, and subsidiaries within the Fusion Events corporate family</li>
                  <li><strong>Legal Requirements:</strong> Government authorities, law enforcement, or other third parties when required by law, court order, or to protect our rights and safety</li>
                  <li><strong>Business Transactions:</strong> In connection with mergers, acquisitions, asset sales, or other business transactions</li>
                  <li><strong>Security and Fraud Prevention:</strong> To detect, investigate, and prevent fraudulent or illegal activities</li>
                  <li><strong>Consent:</strong> When you provide explicit consent to share your information</li>
                  <li><strong>Aggregate Data:</strong> De-identified or aggregated information that cannot reasonably identify you</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">6. International Data Transfers</h4>
                <p>
                  Your information may be transferred to, processed, and stored in countries other than your country of residence, including countries that may not provide the same level of data protection as your jurisdiction. By using the Platform, you expressly consent to such international transfers and acknowledge that your information may be subject to the laws of the jurisdictions in which it is processed.
                </p>
                <p>
                  We may transfer data to any country where we or our service providers operate, including but not limited to the United States, Canada, and members of the European Union.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">7. Data Retention and Deletion</h4>
                <p>
                  We retain your information for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce our agreements. Specific retention periods include:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Retained while your account is active and for up to 7 years after account deletion</li>
                  <li><strong>User Content:</strong> May be retained indefinitely for backup, legal compliance, and business purposes</li>
                  <li><strong>Usage Data:</strong> Retained for up to 10 years for analytics and business intelligence</li>
                  <li><strong>Legal Records:</strong> Retained as required by applicable law or for legitimate business purposes</li>
                </ul>
                <p>
                  Deleted information may persist in backup systems, cached copies, and archives for additional periods. We cannot guarantee complete removal of all copies of your information.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">8. Security Disclaimers</h4>
                <p>
                  While we implement commercially reasonable security measures, we cannot guarantee the absolute security of your information. Data transmission over the internet and electronic storage carry inherent risks, and we disclaim any liability for unauthorized access, data breaches, or security incidents.
                </p>
                <p>
                  <strong>You acknowledge and accept the risks associated with uploading personal photos and information to an internet-based platform.</strong> We are not responsible for any unauthorized access, use, or disclosure of your information resulting from security vulnerabilities, third-party actions, or circumstances beyond our reasonable control.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">9. Your Rights and Choices</h4>
                <p>
                  Subject to applicable law and the limitations set forth in our Terms of Service, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request access to your personal information (subject to verification requirements)</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your information (subject to legal and business requirements)</li>
                  <li><strong>Portability:</strong> Request a copy of your information in a structured format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                </ul>
                <p>
                  <strong>Limitations:</strong> These rights are subject to exceptions for legal compliance, business operations, security purposes, and the rights of other users. We may deny requests that are manifestly unfounded, excessive, or would compromise the privacy of others.
                </p>
                <p>
                  To exercise these rights, contact us at info@fusion-events.ca. We may require identity verification and may charge reasonable fees for certain requests.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">10. Children's Privacy</h4>
                <p>
                  The Platform is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that we have collected information from a child under 18, we will take reasonable steps to delete such information, unless retention is required by law.
                </p>
                <p>
                  Parents and guardians are responsible for monitoring their children's internet usage and ensuring compliance with age restrictions.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">11. Third-Party Services and Links</h4>
                <p>
                  The Platform may integrate with or contain links to third-party services, websites, or applications. We are not responsible for the privacy practices or content of such third parties. Your interactions with third-party services are governed by their respective privacy policies and terms of service.
                </p>
                <p>
                  Third-party service providers may collect information about you when you use the Platform. We do not control their data collection practices and disclaim any responsibility for their handling of your information.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">12. Policy Changes and Updates</h4>
                <p>
                  We may update this Privacy Policy at any time, with or without notice, at our sole discretion. Material changes will be effective immediately upon posting. Your continued use of the Platform after any changes constitutes acceptance of the updated Privacy Policy.
                </p>
                <p>
                  We encourage you to review this Privacy Policy periodically. The "Last Updated" date at the top of this policy indicates when it was last revised.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">13. Contact Information and Complaints</h4>
                <p>
                  For questions, concerns, or requests regarding this Privacy Policy or our privacy practices, contact us at:
                </p>
                <p>
                  <strong>PhotoSphere Inc.</strong><br />
                  (A subsidiary of Fusion Events Inc.)<br />
                  Email: info@fusion-events.ca<br />
                  Privacy Officer<br />
                  Ontario, Canada
                </p>
                <p>
                  <strong>Complaints:</strong> If you believe we have violated applicable privacy laws, you may file a complaint with the appropriate regulatory authority in your jurisdiction. In Canada, you may contact the Office of the Privacy Commissioner of Canada.
                </p>
                <p className="text-sm text-gray-400">
                  <strong>Governing Law:</strong> This Privacy Policy is governed by the laws of Ontario, Canada, and any disputes will be resolved in accordance with our Terms of Service.
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

  // Render the modal using a portal to document.body
  return createPortal(modalContent, document.body);
};

export default PrivacyPolicyModal;