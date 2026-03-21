import React from 'react';
import Link from 'next/link';

export function CommunityFeedPreview() {
    return (
        <section className="space-y-4 md:space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-on-surface font-headline">Community Feed</h2>
                <div className="flex gap-2">
                    <button className="bg-surface-container-lowest border border-outline-variant/20 p-2 rounded-full hover:bg-surface-container-low transition-colors">
                        <span className="material-symbols-outlined text-on-surface-variant">tune</span>
                    </button>
                    <Link href="/community">
                        <button className="bg-primary text-on-primary px-4 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold shadow-sm hover:shadow-md transition-shadow active:scale-95">
                            New Post
                        </button>
                    </Link>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Post 1 */}
                <div className="bg-surface-container-low rounded-2xl p-5 md:p-6 flex gap-3 md:gap-4 border border-outline-variant/10 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex-shrink-0">
                        <img
                            alt="Peer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCrBS_C8OsW8I6gtxZY9S3aefyLpFBdtGP-e2jrFGWJ7s1VDkjog2KwRASKoZ9IudqMzLJnV8v22W2gaYT3A2dJRIxxRC2ZbGrYkzJi466RReRbhZjvxx8DN6dU41rsN-KMY1JqMgPjwpz2gITmstR7mw32DK_cwVI-gk7qiVCU5kQ8QwNz1YQUrPL_BXmVaID4VvhOC41NuCvfBDvsIlGmXLmqiRDKRSNAb-AH1bOfDoSGAnl1QpXUdB7vJblzNqC7ZAk54Jjb5_iY"
                        />
                    </div>
                    <div className="flex-1 space-y-2 md:space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-on-surface text-sm md:text-base">Ananya Singh</h4>
                                <span className="text-[10px] md:text-xs text-on-surface-variant">BSEB Top Scorer • 2h ago</span>
                            </div>
                            <button className="p-1 hover:bg-surface-variant rounded-full transition-colors">
                                <span className="material-symbols-outlined text-on-surface-variant text-sm md:text-base">more_horiz</span>
                            </button>
                        </div>
                        <p className="text-on-surface-variant text-sm md:text-base line-clamp-2 md:line-clamp-none">
                            Does anyone have a clear summary of the 'Optical Isomerism' chapter from the latest NCERT syllabus? Struggling with 3D visualization.
                        </p>
                        <div className="flex items-center gap-4 md:gap-6 pt-2">
                            <button className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm font-medium hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-base md:text-lg">thumb_up</span> 24
                            </button>
                            <button className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm font-medium hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-base md:text-lg">chat_bubble</span> 8
                            </button>
                            <button className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm font-medium hover:text-primary transition-colors ml-auto">
                                <span className="material-symbols-outlined text-base md:text-lg">share</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Post 2 */}
                <div className="bg-surface-container-low rounded-2xl p-5 md:p-6 flex gap-3 md:gap-4 border border-outline-variant/10 shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex-shrink-0">
                        <img
                            alt="Peer"
                            className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmc1Bm-vd5TcCittD11BGRFwPNkUkJPFzqq2KZC4mvhkTZ_lDS7-KFwOy51u95GCiRuQLEoafjqRzoGnm79lanzyup8V8rXOlJ0o7tQd6dBts2g0KZuquZc0bF1NLLawXoj0xbt4_GCd_RN9c_R5fr4fPOGe9YDcdbnvyN22JWlh3Hb2z-66sxqSBb7AWOkkz9kftKbjZ98xrdAtCelUccKgGV_rQc8fWSJteqQMSq-DT_3nlAwQLetYJnXAn0S4c26myhOmT-TG0d"
                        />
                    </div>
                    <div className="flex-1 space-y-2 md:space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-on-surface text-sm md:text-base">Vikram Kumar</h4>
                                <span className="text-[10px] md:text-xs text-on-surface-variant">Class 12 Aspirant • 4h ago</span>
                            </div>
                            <button className="p-1 hover:bg-surface-variant rounded-full transition-colors">
                                <span className="material-symbols-outlined text-on-surface-variant text-sm md:text-base">more_horiz</span>
                            </button>
                        </div>
                        <p className="text-on-surface-variant text-sm md:text-base line-clamp-2 md:line-clamp-none">
                            Just cracked the Mock Test 12! Scoring consistently 85%+. Any tips for boosting Biology score specifically?
                        </p>
                        <div className="flex items-center gap-4 md:gap-6 pt-2">
                            <button className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm font-medium hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-base md:text-lg">thumb_up</span> 156
                            </button>
                            <button className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm font-medium hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-base md:text-lg">chat_bubble</span> 42
                            </button>
                            <button className="flex items-center gap-1.5 text-on-surface-variant text-xs md:text-sm font-medium hover:text-primary transition-colors ml-auto">
                                <span className="material-symbols-outlined text-base md:text-lg">share</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="w-full flex justify-center mt-6">
                <Link href="/community">
                    <button className="text-primary font-bold hover:underline py-2">View More Discussions</button>
                </Link>
            </div>
        </section>
    );
}
