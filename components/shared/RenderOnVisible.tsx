'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

interface RenderOnVisibleProps {
    children: ReactNode;
    className?: string;
    fallback?: ReactNode;
    minHeight?: number;
    rootMargin?: string;
}

export function RenderOnVisible({
    children,
    className,
    fallback,
    minHeight = 160,
    rootMargin = '450px',
}: RenderOnVisibleProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (shouldRender) return;
        if (!('IntersectionObserver' in window)) {
            const timer = setTimeout(() => setShouldRender(true), 0);
            return () => clearTimeout(timer);
        }

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry?.isIntersecting) return;
            setShouldRender(true);
            observer.disconnect();
        }, { rootMargin });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [rootMargin, shouldRender]);

    return (
        <div ref={ref} className={className} style={!shouldRender ? { minHeight } : undefined}>
            {shouldRender ? children : fallback}
        </div>
    );
}

export function RenderAfterIdle({ children, timeout = 1800 }: { children: ReactNode; timeout?: number }) {
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if ('requestIdleCallback' in window) {
            const idleId = window.requestIdleCallback(() => setShouldRender(true), { timeout });
            return () => window.cancelIdleCallback(idleId);
        }

        const timer = setTimeout(() => setShouldRender(true), timeout);
        return () => clearTimeout(timer);
    }, [timeout]);

    return shouldRender ? <>{children}</> : null;
}
