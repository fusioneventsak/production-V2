import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose }) => {
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
            <h3 className="text-2xl font-bold text-white">Terms and Conditions</h3>
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
                <h4 className="text-xl font-semibold text-white">1. Acceptance of Terms</h4>
                <p>
                  By accessing, using, or clicking "I agree" to the PhotoSphere platform, website, mobile applications, or any related services (collectively, the "Platform"), you ("User," "you," or "your") enter into a legally binding agreement with PhotoSphere Inc., a subsidiary of Fusion Events Inc. ("Company," "we," "us," or "our") and agree to be bound by these Terms of Service ("Terms"). If you do not agree to all Terms, you must immediately cease all use of the Platform.
                </p>
                <p>
                  <strong>These Terms contain important provisions, including an arbitration clause and class action waiver that affect your rights. Please read them carefully.</strong>
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">2. Modifications to Terms</h4>
                <p>
                  We reserve the absolute right to modify, update, or replace these Terms at any time, with or without notice, at our sole discretion. Material changes will be effective immediately upon posting to the Platform. Your continued use of the Platform after any changes constitutes acceptance of the modified Terms. You are responsible for regularly reviewing these Terms. We may also modify or discontinue any aspect of the Platform without notice.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">3. Platform Description and Account Requirements</h4>
                <p>
                  PhotoSphere provides a 3D photo collage visualization platform that allows users to create, manage, and display interactive photo collections ("Collages"). The Platform includes both authenticated user accounts and anonymous upload capabilities via event codes.
                </p>
                <p>
                  <strong>Account Registration:</strong> To create and manage Collages, you must register for an account by providing accurate, current, and complete information. You must be at least 18 years old or have parental consent to use the Platform. You are solely responsible for maintaining the security of your account credentials and for all activities under your account, whether authorized or not.
                </p>
                <p>
                  <strong>Anonymous Use:</strong> The Platform allows anonymous photo uploads using event codes. By using this feature, you acknowledge that your uploads are subject to these Terms and our content policies.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">4. User Content, Rights, and Restrictions</h4>
                <p>
                  The Platform allows you to upload, share, and display photos and other content ("User Content"). You retain ownership of your User Content, but by uploading any content, you grant us extensive rights as outlined below.
                </p>
                <p>
                  <strong>License Grant to Company:</strong> You hereby grant PhotoSphere a perpetual, irrevocable, worldwide, royalty-free, non-exclusive, sublicensable, and transferable license to use, reproduce, modify, adapt, translate, distribute, publicly display, publicly perform, and create derivative works from your User Content for any purpose related to operating, promoting, or improving the Platform, including but not limited to creating promotional materials, training AI models, and developing new features.
                </p>
                <p>
                  <strong>Content Representations and Warranties:</strong> By uploading User Content, you represent, warrant, and covenant that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You own all rights to the User Content or have obtained all necessary permissions, licenses, and consents</li>
                  <li>You have obtained explicit consent from any individuals appearing in photos, including model releases where applicable</li>
                  <li>The User Content does not infringe any intellectual property rights, privacy rights, publicity rights, or other proprietary rights</li>
                  <li>The User Content does not violate any applicable laws, regulations, or these Terms</li>
                  <li>The User Content is not defamatory, obscene, pornographic, violent, harassing, threatening, or otherwise objectionable</li>
                  <li>You will not upload copyrighted material without permission from the copyright holder</li>
                </ul>
                <p>
                  <strong>Prohibited Content:</strong> You may not upload content that: (a) is illegal, harmful, threatening, abusive, defamatory, or invasive of privacy; (b) contains nudity, sexually explicit material, or content inappropriate for minors; (c) infringes intellectual property rights; (d) contains malware or malicious code; (e) promotes illegal activities; or (f) violates any applicable law or regulation.
                </p>
                <p>
                  <strong>Content Moderation:</strong> We reserve the right, but have no obligation, to monitor, review, edit, or remove any User Content at any time for any reason without notice. We may use automated systems and human moderators for content review. Collage owners may moderate content within their own Collages.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">5. Photo-Specific Terms and Privacy Rights</h4>
                <p>
                  <strong>Photo Upload Responsibility:</strong> You acknowledge that photo-sharing platforms carry inherent risks. You are solely responsible for: (a) obtaining all necessary consents before photographing or uploading images of individuals; (b) ensuring you have rights to all uploaded photos; (c) understanding that photos may be viewed by other users of public Collages; and (d) any consequences arising from your photo uploads.
                </p>
                <p>
                  <strong>Privacy and Consent:</strong> For any photo containing identifiable individuals, you represent that you have obtained explicit consent from all depicted persons for their image to be used, displayed, and processed through the Platform. This includes consent for 3D visualization, real-time display, and potential promotional use.
                </p>
                <p>
                  <strong>Company Disclaimers:</strong> WE EXPRESSLY DISCLAIM ALL LIABILITY FOR: (a) unauthorized use or distribution of photos by other users; (b) privacy violations resulting from photo uploads; (c) copyright infringement claims; (d) misuse of photos for commercial or personal purposes; (e) data breaches or unauthorized access to photos; and (f) any harm arising from photo content or display.
                </p>
                <p>
                  <strong>Takedown Procedures:</strong> If you believe your rights have been violated, contact us immediately at info@fusion-events.ca with detailed information. We reserve the right to remove content without investigation and may terminate accounts for repeated violations.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">6. Payment Terms and Subscription Services</h4>
                <p>
                  <strong>Service Tiers:</strong> PhotoSphere offers free and paid subscription tiers with different features and limitations. Current pricing and features are available on our website and may change at any time.
                </p>
                <p>
                  <strong>Payment and Billing:</strong> Paid subscriptions are billed in advance on a recurring basis. You authorize us to charge your payment method for all fees. If payment fails, we may suspend or terminate your account. You are responsible for all taxes and third-party fees.
                </p>
                <p>
                  <strong>Cancellation and Refunds:</strong> You may cancel your subscription at any time, effective at the end of your current billing period. We do not provide refunds for partial periods or unused services, except where required by law. Upon cancellation, your account may be downgraded to the free tier with corresponding feature limitations.
                </p>
                <p>
                  <strong>Price Changes:</strong> We may change subscription prices at any time with or without notice. Price changes for existing subscribers will take effect at the next billing cycle.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">7. Disclaimer of Warranties and Platform Availability</h4>
                <p>
                  THE PLATFORM IS PROVIDED "AS IS," "AS AVAILABLE," AND "WITH ALL FAULTS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, QUIET ENJOYMENT, AND SYSTEM INTEGRATION.
                </p>
                <p>
                  WE DO NOT WARRANT THAT: (a) THE PLATFORM WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE; (b) DEFECTS WILL BE CORRECTED; (c) THE PLATFORM IS FREE FROM VIRUSES OR HARMFUL COMPONENTS; (d) YOUR DATA WILL BE SECURE OR NOT LOST; (e) THE PLATFORM WILL MEET YOUR REQUIREMENTS; OR (f) THE RESULTS FROM USING THE PLATFORM WILL BE ACCURATE OR RELIABLE.
                </p>
                <p>
                  YOU ACKNOWLEDGE THAT INTERNET-BASED SERVICES ARE SUBJECT TO INTERRUPTIONS, DELAYS, AND OTHER PROBLEMS INHERENT IN ELECTRONIC COMMUNICATIONS AND NETWORKS.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">8. Limitation of Liability and Damages</h4>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL PHOTOSPHERE, ITS PARENT COMPANY FUSION EVENTS INC., AFFILIATES, DIRECTORS, OFFICERS, EMPLOYEES, AGENTS, CONTRACTORS, OR LICENSORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Loss of profits, revenue, data, or business opportunities</li>
                  <li>Privacy violations or unauthorized disclosure of personal information</li>
                  <li>Copyright infringement claims or intellectual property disputes</li>
                  <li>Harm to reputation or emotional distress</li>
                  <li>Cost of substitute services or technology failures</li>
                  <li>Any damages arising from User Content or third-party actions</li>
                </ul>
                <p>
                  THIS LIMITATION APPLIES REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, NEGLIGENCE, STRICT LIABILITY, OR OTHERWISE) AND EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
                <p>
                  <strong>Aggregate Liability Cap:</strong> OUR TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATING TO THE PLATFORM SHALL NOT EXCEED THE GREATER OF: (a) CAD $100; OR (b) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
                </p>
                <p>
                  <strong>Essential Purpose:</strong> These limitations are fundamental elements of the basis of the bargain between you and PhotoSphere. The Platform would not be provided without such limitations.
                </p>
                <p>
                  <strong>Consumer Protection Compliance:</strong> Nothing in these Terms limits any rights you may have under applicable Canadian consumer protection legislation, including but not limited to the Consumer Protection Act (Ontario).
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">9. Indemnification and Defense</h4>
                <p>
                  You agree to defend, indemnify, and hold harmless PhotoSphere, its parent company Fusion Events Inc., and their respective affiliates, directors, officers, employees, agents, contractors, and licensors from and against all claims, demands, actions, damages, losses, costs, and expenses (including reasonable attorneys' fees and court costs) arising from or relating to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your use or misuse of the Platform</li>
                  <li>Your User Content, including any copyright, trademark, privacy, or publicity rights violations</li>
                  <li>Your violation of these Terms or any applicable law</li>
                  <li>Your interactions with other users or third parties through the Platform</li>
                  <li>Any false or misleading information you provide</li>
                  <li>Your breach of any representation, warranty, or covenant in these Terms</li>
                </ul>
                <p>
                  We reserve the right to assume exclusive defense and control of any matter subject to indemnification, and you agree to cooperate with our defense. This indemnification obligation survives termination of these Terms.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">10. Dispute Resolution and Arbitration</h4>
                <p>
                  <strong>Mandatory Arbitration:</strong> Any dispute, claim, or controversy arising from or relating to these Terms or the Platform shall be resolved through binding arbitration rather than in court, except for claims that may be brought in small claims court or where prohibited by applicable law.
                </p>
                <p>
                  Arbitration will be conducted by ADR Chambers under its Commercial Arbitration Rules. The arbitration will be held in Ontario, Canada, or virtually at the arbitrator's discretion. You and PhotoSphere agree that arbitration will be conducted on an individual basis only.
                </p>
                <p>
                  <strong>Class Action Waiver:</strong> TO THE EXTENT PERMITTED BY APPLICABLE LAW, YOU AND PHOTOSPHERE AGREE THAT ANY ARBITRATION OR COURT PROCEEDING SHALL BE LIMITED TO THE DISPUTE BETWEEN PHOTOSPHERE AND YOU INDIVIDUALLY. YOU WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION.
                </p>
                <p>
                  <strong>Governing Law:</strong> These Terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein, without regard to conflict of law principles. Any court proceedings must be brought in the courts of competent jurisdiction in Ontario, Canada.
                </p>
                <p>
                  <strong>Consumer Protection:</strong> Nothing in these Terms limits any rights you may have under applicable Canadian consumer protection legislation.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">11. Account Termination and Data Retention</h4>
                <p>
                  <strong>Termination by Company:</strong> We may suspend, restrict, or terminate your account immediately, without prior notice or liability, for any reason, including: (a) violation of these Terms; (b) suspected illegal activity; (c) extended inactivity; (d) non-payment of fees; (e) to comply with legal requirements; or (f) at our sole discretion to protect the Platform or other users.
                </p>
                <p>
                  <strong>Termination by User:</strong> You may terminate your account at any time by following the account deletion process in your settings or contacting support. Termination does not relieve you of any obligations incurred prior to termination.
                </p>
                <p>
                  <strong>Effect of Termination:</strong> Upon termination: (a) your access to the Platform will cease immediately; (b) we may delete your User Content; (c) unpaid fees become immediately due; (d) licenses granted to us may survive termination; and (e) provisions that by their nature should survive termination will continue to apply.
                </p>
                <p>
                  <strong>Data Retention:</strong> We may retain your data for backup, legal compliance, or business purposes for up to 90 days after termination, unless longer retention is required by law.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">12. General Provisions</h4>
                <p>
                  <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and PhotoSphere and supersede all prior agreements and understandings.
                </p>
                <p>
                  <strong>Severability:</strong> If any provision of these Terms is deemed invalid or unenforceable, the remaining provisions will remain in full force and effect.
                </p>
                <p>
                  <strong>No Waiver:</strong> Our failure to enforce any provision does not constitute a waiver of that provision or any other provision.
                </p>
                <p>
                  <strong>Assignment:</strong> You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms without restriction.
                </p>
                <p>
                  <strong>Force Majeure:</strong> We are not liable for any failure to perform due to causes beyond our reasonable control, including natural disasters, government actions, or internet infrastructure failures.
                </p>
                <p>
                  <strong>Notices:</strong> All legal notices must be sent to info@fusion-events.ca. Notices to you may be sent to your registered email address.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">13. Contact Information</h4>
                <p>
                  If you have any questions about these Terms, please contact us at:
                </p>
                <p>
                  <strong>PhotoSphere Inc.</strong><br />
                  (A subsidiary of Fusion Events Inc.)<br />
                  Email: info@fusion-events.ca<br />
                  Legal Department<br />
                  Ontario, Canada
                </p>
                <p className="text-sm text-gray-400">
                  <strong>Effective Date:</strong> These Terms are effective as of July 16, 2025.
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

export default TermsAndConditionsModal;