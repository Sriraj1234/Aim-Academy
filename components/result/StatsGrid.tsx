import { FaBullseye, FaCheckCircle, FaClock } from 'react-icons/fa'

export const StatsGrid = () => {
    const stats = [
        {
            label: 'Accuracy',
            value: '85%',
            icon: <FaBullseye />,
            color: 'text-blue-600',
            bg: 'bg-blue-100'
        },
        {
            label: 'Time Taken',
            value: '12m',
            icon: <FaClock />,
            color: 'text-orange-600',
            bg: 'bg-orange-100'
        },
        {
            label: 'Correct',
            value: '17/20',
            icon: <FaCheckCircle />,
            color: 'text-green-600',
            bg: 'bg-green-100'
        },
    ]

    return (
        <div className="grid grid-cols-3 gap-3 w-full">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white border border-pw-border rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className={`w-8 h-8 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-2 text-sm`}>
                        {stat.icon}
                    </div>
                    <p className="text-lg font-bold text-pw-violet">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
            ))}
        </div>
    )
}
