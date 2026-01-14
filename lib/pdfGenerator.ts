import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Summary {
    title: string;
    keyPoints: string[];
    definitions: { term: string; meaning: string }[];
    formulas: string[];
    importantDates: { event: string; date: string }[];
    mnemonics: string[];
    examTips: string[];
    images?: { url: string; caption: string }[];
}

interface Context {
    subject: string;
    chapter: string;
    classLevel?: string;
    board?: string;
}

// Helper to load font
const loadFont = async (doc: jsPDF) => {
    try {
        const ttfUrl = 'https://raw.githubusercontent.com/googlefonts/noto-fonts/main/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf';
        const response = await fetch(ttfUrl);
        const buffer = await response.arrayBuffer();

        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = window.btoa(binary);

        doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', base64);
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
        return true;
    } catch (e) {
        console.error("Failed to load Hindi font", e);
        return false;
    }
};

// Helper to fetch image as base64
const fetchImage = async (url: string): Promise<string | null> => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn("Failed to fetch image for PDF:", url, e);
        return null; // Fail gracefully
    }
};

export const exportSummaryToPDF = async (summary: Summary, context: Context) => {
    const doc = new jsPDF();
    await loadFont(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = 20;
    const contentWidth = pageWidth - (margin * 2);

    const ensureSpace = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
            doc.addPage();
            yPos = margin;
            return true;
        }
        return false;
    };

    const addTextBlock = (
        text: string,
        fontSize: number = 11,
        fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
        color: string = '#374151',
        indent: number = 0,
        bottomPadding: number = 2
    ) => {
        doc.setFontSize(fontSize);

        const hasHindi = /[\u0900-\u097F]/.test(text);
        if (hasHindi) {
            doc.setFont('NotoSansDevanagari', 'normal');
        } else {
            doc.setFont('helvetica', fontStyle);
        }

        doc.setTextColor(color);
        const sanitizedText = text.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '').trim();

        const availableWidth = contentWidth - indent;
        const lines = doc.splitTextToSize(sanitizedText, availableWidth);
        const lineHeightFactor = hasHindi ? 1.3 : 1.15;
        const blockHeight = lines.length * (fontSize * lineHeightFactor * 0.352777778);

        ensureSpace(blockHeight + bottomPadding);
        doc.text(lines, margin + indent, yPos);
        yPos += blockHeight + bottomPadding;
    };

    const addSectionHeader = (title: string, color: string) => {
        ensureSpace(20);
        yPos += 5;
        doc.setFillColor(color);
        doc.rect(margin, yPos + 1, 1.5, 6, 'F');
        addTextBlock(title, 14, 'bold', '#111827', 4, 6);
    };

    // --- HEADER ---
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageWidth, 6, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#ffffff');
    doc.text("Padhaku - Padhaku AI", pageWidth - margin, 4.5, { align: 'right' });
    yPos += 14;

    addTextBlock(summary.title.toUpperCase(), 18, 'bold', '#111827', 0, 4);
    addTextBlock(`${context.subject} | Class ${context.classLevel || '10'} ${context.board || ''}`, 10, 'normal', '#6b7280', 0, 10);

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // --- SECTIONS ---
    if (summary.keyPoints?.length > 0) {
        addSectionHeader("Key Concepts", '#4f46e5');
        summary.keyPoints.forEach(point => {
            const cleanPoint = point.replace(/\*\*/g, '').replace(/\*/g, '').trim();
            addTextBlock(`•  ${cleanPoint}`, 11, 'normal', '#374151', 2, 4);
        });
        yPos += 4;
    }

    if (summary.definitions?.length > 0) {
        addSectionHeader("Important Definitions", '#0ea5e9');
        summary.definitions.forEach(def => {
            addTextBlock(def.term, 11, 'bold', '#111827', 2, 1);
            addTextBlock(`   ${def.meaning}`, 11, 'normal', '#4b5563', 2, 6);
        });
        yPos += 4;
    }

    if (summary.formulas?.length > 0) {
        addSectionHeader("Formulas", '#eab308');
        summary.formulas.forEach(formula => {
            // FIX: Detect font for formula instead of forcing Courier
            const indent = 6;
            const width = contentWidth - indent - 4;

            const fontSize = 11;
            const hasHindi = /[\u0900-\u097F]/.test(formula);

            doc.setFontSize(fontSize);
            if (hasHindi) {
                doc.setFont('NotoSansDevanagari', 'normal');
            } else {
                doc.setFont('courier', 'bold');
            }

            const lines = doc.splitTextToSize(formula, width);
            const lineHeightFactor = hasHindi ? 1.3 : 1.15;
            const height = (lines.length * fontSize * lineHeightFactor * 0.352777778) + 8;

            ensureSpace(height + 4);

            doc.setFillColor(254, 252, 232);
            doc.roundedRect(margin + 2, yPos, contentWidth - 4, height, 1, 1, 'F');

            doc.setTextColor('#854d0e');
            doc.text(lines, margin + indent, yPos + 6);
            yPos += height + 4;
        });
        yPos += 4;
    }

    if (summary.importantDates?.length > 0) {
        addSectionHeader("Timeline", '#ef4444');
        summary.importantDates.forEach(item => {
            addTextBlock(`${item.date} - ${item.event}`, 11, 'normal', '#374151', 2, 4);
        });
        yPos += 4;
    }

    if (summary.mnemonics?.length > 0) {
        addSectionHeader("Brain Hacks (Mnemonics)", '#22c55e');
        summary.mnemonics.forEach(m => {
            addTextBlock(`TIP: ${m}`, 11, 'italic', '#15803d', 2, 6);
        });
        yPos += 4;
    }

    if (summary.examTips?.length > 0) {
        addSectionHeader("Exam Tips", '#f97316');
        summary.examTips.forEach(tip => {
            addTextBlock(`(!)  ${tip}`, 11, 'normal', '#c2410c', 2, 4);
        });
    }

    // --- IMAGES ---
    if (summary.images && summary.images.length > 0) {
        addSectionHeader("Visual References", '#ec4899');

        for (const img of summary.images) {
            try {
                // Check if space needed (approx 80mm height)
                ensureSpace(85);

                // Fetch image (handling base64 or URL)
                const base64Img = await fetchImage(img.url);

                if (base64Img) {
                    // Calc aspect ratio if possible using logic or just fit to box
                    // For PDF, we usually fix width or height.
                    // Fits within width: 100mm? 
                    const imgWidth = 100;
                    const imgHeight = 75; // 4:3 default assumption

                    doc.addImage(base64Img, 'JPEG', margin + 10, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 2;

                    addTextBlock(img.caption, 9, 'italic', '#666', 10, 8);
                }
            } catch (e) {
                console.warn("Could not add image PDF", e);
            }
        }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor('#9ca3af');
        doc.text(`Generated by Padhaku AI - Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    doc.save(`${context.subject}_${context.chapter.replace(/\s+/g, '_')}_Notes.pdf`);
};
