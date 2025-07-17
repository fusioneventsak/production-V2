import React from 'react';
import { X } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsAndConditionsModal: React.FC<TermsAndConditionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-black bg-opacity-75 backdrop-blur-sm"
          onClick={onClose}
        ></div>

        {/* Modal content */}
        <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-900 border border-gray-700 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Terms and Conditions</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-6 text-gray-300">
              <p className="text-sm text-gray-400">Last Updated: July 1, 2025</p>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">1. Acceptance of Terms</h4>
                <p>
                  By accessing or using the PhotoSphere service, website, or any applications made available by PhotoSphere (collectively, the "Service"), you agree to be bound by these terms of service ("Terms"). If you do not agree to all of these Terms, you may not use the Service.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">2. Changes to Terms</h4>
                <p>
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">3. Account Terms</h4>
                <p>
                  To use certain features of the Service, you must register for an account. You must provide accurate, current, and complete information during the registration process and keep your account information up-to-date.
                </p>
                <p>
                  You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. We encourage you to use "strong" passwords (passwords that use a combination of upper and lower case letters, numbers, and symbols) with your account.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">4. User Content and Conduct</h4>
                <p>
                  Our Service allows you to upload, share, and store content, including photos, text, and other materials ("User Content"). You retain all rights in, and are solely responsible for, the User Content you upload, post, or otherwise make available via the Service.
                </p>
                <p>
                  <strong>By uploading User Content, you represent and warrant that:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You own or have the necessary licenses, rights, consents, and permissions to use and authorize us to use all intellectual property rights in and to any User Content</li>
                  <li>The User Content does not violate any third party's intellectual property rights, privacy rights, publicity rights, or other personal or proprietary rights</li>
                  <li>The User Content does not contain material that is unlawful, obscene, defamatory, pornographic, harassing, threatening, or otherwise objectionable</li>
                </ul>
                <p>
                  <strong>You acknowledge and agree that:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We are not responsible for any User Content that you or other users upload, post, or otherwise make available</li>
                  <li>We may, but have no obligation to, monitor or review User Content</li>
                  <li>We have the right to remove any User Content for any reason without notice</li>
                  <li>We take no responsibility and assume no liability for any User Content that you or any other user or third party posts or sends via the Service</li>
                  <li>You are solely responsible for your interactions with other users of the Service</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">5. Photo Content and Liability</h4>
                <p>
                  <strong>Regarding photos and other visual content specifically:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are solely responsible for obtaining proper consent from any individuals appearing in photos you upload</li>
                  <li>We take no responsibility for the content of photos uploaded to our platform</li>
                  <li>We expressly disclaim any liability arising from the misuse of photos by any users or third parties</li>
                  <li>We are not responsible for unauthorized use, distribution, or reproduction of photos by other users</li>
                  <li>We reserve the right to remove any photos that we determine, in our sole discretion, violate these Terms or may expose us to potential legal liability</li>
                </ul>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">6. License Grant</h4>
                <p>
                  By posting User Content on or through the Service, you grant us a non-exclusive, royalty-free, transferable, sublicensable, worldwide license to use, modify, publicly display, publicly perform, and distribute your User Content in connection with operating and providing the Service.
                </p>
                <p>
                  You can end this license at any time by deleting your User Content or account. However, content may persist in backup copies for a reasonable period of time.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">7. Disclaimer of Warranties</h4>
                <p>
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
                </p>
                <p>
                  WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">8. Limitation of Liability</h4>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL WE, OUR AFFILIATES, DIRECTORS, EMPLOYEES, AGENTS, OR SERVICE PROVIDERS BE LIABLE FOR ANY INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, LOSS OF DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR THE USE OF, OR INABILITY TO USE, THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
                <p>
                  IN NO EVENT WILL OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THESE TERMS OR THE SERVICE EXCEED THE GREATER OF $100 USD OR THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE EVENT GIVING RISE TO THE LIABILITY.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">9. Indemnification</h4>
                <p>
                  You agree to defend, indemnify, and hold us harmless from and against any claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable legal and accounting fees, arising out of or in any way connected with your access to or use of the Service, your User Content, or your violation of these Terms.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">10. Governing Law</h4>
                <p>
                  These Terms shall be governed by the laws of the state of [State/Province], without respect to its conflict of laws principles. You and we agree to submit to the personal jurisdiction of a state court located in [County], [State/Province] for any actions not subject to arbitration.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">11. Termination</h4>
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                </p>
                <p>
                  Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or delete your account.
                </p>
              </section>
              
              <section className="space-y-3">
                <h4 className="text-xl font-semibold text-white">12. Contact Information</h4>
                <p>
                  If you have any questions about these Terms, please contact us at terms@photosphere.com.
                </p>
              </section>
            </div>
          </div>
          
          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;