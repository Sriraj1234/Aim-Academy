'use client';

import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-300 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand & Description */}
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                            Padhaku
                        </Link>
                        <p className="mt-4 text-sm text-gray-400 leading-relaxed">
                            Empowering students with AI-driven learning tools. Master Bihar Board exams with confidence.
                        </p>
                        <div className="flex space-x-4 mt-6">
                            <SocialIcon icon={FaInstagram} href="#" label="Instagram" />
                            <SocialIcon icon={FaTwitter} href="#" label="Twitter" />
                            <SocialIcon icon={FaLinkedin} href="#" label="LinkedIn" />
                            <SocialIcon icon={FaGithub} href="#" label="GitHub" />
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/home" className="hover:text-indigo-400 transition-colors">Dashboard</Link></li>
                            <li><Link href="/study-hub" className="hover:text-indigo-400 transition-colors">Study Hub</Link></li>
                            <li><Link href="/play/selection" className="hover:text-indigo-400 transition-colors">Practice Zone</Link></li>
                            <li><Link href="/leaderboard" className="hover:text-indigo-400 transition-colors">Leaderboard</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-indigo-400 transition-colors">Contact Support</Link></li>
                            <li><Link href="/careers" className="hover:text-indigo-400 transition-colors">Careers</Link></li>
                            <li><Link href="/blog" className="hover:text-indigo-400 transition-colors">Blog</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/refund" className="hover:text-indigo-400 transition-colors">Refund Policy</Link></li>
                            <li><Link href="/cookies" className="hover:text-indigo-400 transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
                    <p>&copy; {currentYear} Padhaku Academy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

const SocialIcon = ({ icon: Icon, href, label }: { icon: any, href: string, label: string }) => (
    <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 text-gray-400 hover:bg-indigo-500 hover:text-white transition-all duration-300 transform hover:scale-110"
        aria-label={label}
    >
        <Icon size={14} />
    </a>
);
