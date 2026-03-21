import React from 'react';
import Link from 'next/link';

export function HeroBento() {
    return (
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[400px]">
            {/* Free Study Hub Large Card */}
            <div className="md:col-span-8 relative overflow-hidden rounded-2xl bg-primary text-on-primary p-8 md:p-10 flex flex-col justify-between group shadow-sm hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none transform translate-x-1/4 group-hover:scale-105 transition-transform duration-700">
                    <img
                        alt="Study Background"
                        className="w-full h-full object-cover rounded-full"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV_7uF2RdHDIeOrRcYnuT_hHgXyQFLDnMzSZZnd6QHHyRwhBEri8ilaeO27QrP02jdyj1wY5MG6kEUsnrtWFAeYyQa3IbSIMOtro2gOSXtwYXRJkpdyWKbNWdflV7ieBD1RV1qgd-PJ5EtzxzD9LOoVBmIXt9TbtVv-P7GRU4NZi-5ZUsTEZLpifx-qu3xK5UilQqJNo44tRq3LYbLnFb-AJjkAYqI7AlwItD-GRATQ5dzkFlX5E0RFXOvFHvuv7G3FV8Fe2HJeyFY"
                    />
                </div>
                <div className="relative z-10 max-w-lg space-y-4 md:space-y-6 flex-1 flex flex-col justify-center">
                    <h2 className="text-3xl md:text-5xl font-extrabold font-headline leading-tight">Free Study Hub</h2>
                    <p className="text-on-primary/90 text-sm md:text-lg leading-relaxed flex-1">
                        Access 10,000+ interactive mock tests, previous year papers, and conceptual videos specifically curated for Bihar State Exams.
                    </p>
                    <Link href="/study-hub">
                        <button className="bg-secondary-container text-on-secondary-container px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-secondary-fixed transition-colors flex items-center justify-center gap-2 md:gap-3 w-fit shadow-md hover:shadow-lg active:scale-95">
                            Start Learning <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </Link>
                </div>
            </div>

            {/* Exam Countdown Widget */}
            <div className="md:col-span-4 bg-tertiary-container rounded-2xl p-6 md:p-8 flex flex-col justify-center items-center text-center space-y-5 md:space-y-6 shadow-sm border border-outline-variant/5">
                <div className="p-4 bg-on-tertiary-container/10 rounded-full">
                    <span className="material-symbols-outlined text-on-tertiary-container text-3xl md:text-4xl">event_upcoming</span>
                </div>
                <div>
                    <h3 className="text-xl md:text-2xl font-bold text-on-tertiary-container font-headline">BSEB 2025</h3>
                    <p className="text-on-tertiary-container/80 font-medium uppercase tracking-widest text-xs mt-1">Countdown</p>
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full px-2">
                    <div className="bg-surface-container-lowest rounded-xl p-3 md:p-4 shadow-sm">
                        <span className="block text-2xl md:text-3xl font-bold text-tertiary">342</span>
                        <span className="text-[10px] md:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Days</span>
                    </div>
                    <div className="bg-surface-container-lowest rounded-xl p-3 md:p-4 shadow-sm">
                        <span className="block text-2xl md:text-3xl font-bold text-tertiary">14</span>
                        <span className="text-[10px] md:text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Hours</span>
                    </div>
                </div>
                <button className="text-on-tertiary-container font-bold text-sm underline underline-offset-4 hover:opacity-80 transition-opacity">
                    Set Reminder
                </button>
            </div>
        </section>
    );
}
