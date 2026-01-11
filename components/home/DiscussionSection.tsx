'use client';

import Link from 'next/link';
import { FaComments, FaArrowRight, FaQuestionCircle, FaUserFriends } from 'react-icons/fa';
import { motion } from 'framer-motion';

export const DiscussionSection = () => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 border border-pw-border shadow-pw-md"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-pw-violet flex items-center gap-2">
                    <span className="text-xl">💬</span> Community
                </h3>
                <Link href="/discussions" className="text-pw-indigo text-xs font-bold hover:underline flex items-center gap-1">
                    View All <FaArrowRight />
                </Link>
            </div>

            <Link href="/discussions" className="block group">
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100 hover:shadow-md transition-all group-hover:scale-[1.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-indigo-500 text-xl shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            <FaQuestionCircle />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">Discussion Board</h4>
                            <p className="text-xs text-gray-500 font-medium">Ask doubts, help friends & get verified answers.</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-indigo-500 shadow-sm border border-transparent group-hover:border-indigo-100 transition-all">
                            <FaArrowRight />
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center justify-between text-[10px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                            <FaUserFriends className="text-indigo-400" /> 10+ Students Online
                        </span>
                        <span className="text-indigo-500">New doubts added</span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};
