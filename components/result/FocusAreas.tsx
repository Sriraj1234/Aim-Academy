import { FaArrowRight } from 'react-icons/fa'

export const FocusAreas = () => {
    const areas = [
        { topic: 'Optics', mistakes: 2 },
        { topic: 'Magnetism', mistakes: 1 },
    ]

    return (
        <div className="w-full">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Attention Needed
            </h3>
            <div className="space-y-3">
                {areas.map((area, i) => (
                    <div key={i} className="bg-white border border-pw-border rounded-xl p-4 flex items-center justify-between group cursor-pointer hover:shadow-pw-sm transition-all hover:bg-gray-50">
                        <div>
                            <p className="font-bold text-pw-violet">{area.topic}</p>
                            <p className="text-xs text-red-500 font-medium">{area.mistakes} Mistakes</p>
                        </div>
                        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-pw-indigo group-hover:text-white transition-colors">
                            <FaArrowRight size={12} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
