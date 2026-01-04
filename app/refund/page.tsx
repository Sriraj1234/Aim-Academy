'use client';

import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

export default function RefundPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <main className="pt-24 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Refund & Cancellation Policy</h1>
                        <p className="text-gray-500 mb-8">Last updated: January 2026</p>

                        <div className="prose prose-indigo max-w-none text-gray-600">
                            <h3>1. Subscription Cancellations</h3>
                            <p>
                                You may cancel your Premium subscription renewal at any time from your account settings page or by contacting our customer support team. Your cancellation will be effective at the end of the current paid term.
                            </p>
                            <p>
                                If you cancel, you will continue to have access to Premium features until the end of your current billing period, but you will not receive a refund for any portion of the fees already paid for your current subscription period.
                            </p>

                            <h3>2. 7-Day Money Back Guarantee</h3>
                            <p>
                                We offer a 7-day money-back guarantee for first-time Premium subscribers. If you are not satisfied with Padhaku Premium within the first 7 days of your initial purchase, you may request a full refund.
                            </p>
                            <p>
                                To request a refund, please contact us at <strong>support@aimacademy.com</strong> with your order details and the reason for your dissatisfaction. We appreciate your feedback as it helps us improve.
                            </p>

                            <h3>3. Refund Eligibility</h3>
                            <p>
                                Refunds are generally not provided for:
                            </p>
                            <ul>
                                <li>Renewal payments (unless requested within 24 hours of the renewal charge).</li>
                                <li>Partial months of service.</li>
                                <li>Accounts banned for violation of our Terms of Service.</li>
                            </ul>

                            <h3>4. Processing Time</h3>
                            <p>
                                Once your refund request is approved, please allow 5-10 business days for the credit to appear on your statement. The refund will be issued to the original payment method used for the purchase.
                            </p>

                            <h3>5. Contact Us</h3>
                            <p>
                                If you have questions about our Refunds & Cancellations Policy, please contact us at:
                                <br />
                                <strong>Padhaku Support Team</strong>
                                <br />
                                Email: support@aimacademy.com
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
