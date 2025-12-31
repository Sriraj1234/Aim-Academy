import { Question, User } from './types'

export const mockUsers: User[] = [
    { id: 'u1', name: 'Rahul Kumar', email: 'rahul@example.com', board: 'bseb', language: 'english', class: '10' },
    { id: 'u2', name: 'Priya Singh', email: 'priya@example.com', board: 'bseb', language: 'hindi', class: '10' },
    { id: 'u3', name: 'Amit Raj', email: 'amit@example.com', board: 'bseb', language: 'english', class: '10' },
]

export const mockQuestions: Question[] = [
    // Physics Questions
    {
        id: 'p1',
        board: 'bseb',
        language: 'english',
        subject: 'physics',
        class: '10',
        year: 2023,
        question: 'The SI unit of electric current is:',
        options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
        correctAnswer: 1,
        chapter: 'Electricity',
        topic: 'Electric Current',
        difficulty: 'easy',
        marks: 1,
        questionType: 'mcq',
        explanation: 'The SI unit of electric current is Ampere (A).',
        tags: ['SI Units', 'Electricity']
    },
    {
        id: 'p2',
        board: 'bseb',
        language: 'english',
        subject: 'physics',
        class: '10',
        year: 2022,
        question: 'Which mirror is used in headlights of vehicles?',
        options: ['Convex Mirror', 'Plane Mirror', 'Concave Mirror', 'None of these'],
        correctAnswer: 2,
        chapter: 'Light',
        topic: 'Reflection',
        difficulty: 'medium',
        marks: 1,
        questionType: 'mcq',
        explanation: 'Concave mirrors are used in headlights to produce a powerful parallel beam of light.',
        tags: ['Light', 'Mirrors']
    },
    {
        id: 'p3',
        board: 'bseb',
        language: 'english',
        subject: 'physics',
        class: '10',
        year: 2021,
        question: 'The focal length of a plane mirror is:',
        options: ['Positive', 'Negative', 'Zero', 'Infinity'],
        correctAnswer: 3,
        chapter: 'Light',
        topic: 'Reflection',
        difficulty: 'hard',
        marks: 1,
        questionType: 'mcq',
        explanation: 'Focal length of a plane mirror is infinity as parallel rays reflect parallel.',
        tags: ['Light', 'Mirrors']
    },

    // Chemistry Questions
    {
        id: 'c1',
        board: 'bseb',
        language: 'english',
        subject: 'chemistry',
        class: '10',
        year: 2023,
        question: 'What happens when dilute Hydrochloric acid is added to iron filings?',
        options: [
            'Hydrogen gas and Iron chloride are produced',
            'Chlorine gas and Iron hydroxide are produced',
            'No reaction takes place',
            'Iron salt and water are produced'
        ],
        correctAnswer: 0,
        chapter: 'Chemical Reactions',
        topic: 'Acids',
        difficulty: 'medium',
        marks: 1,
        questionType: 'mcq',
        explanation: 'Fe + 2HCl -> FeCl2 + H2. Hydrogen gas and Iron(II) chloride are formed.',
        tags: ['Reactions', 'Acids']
    },
    {
        id: 'c2',
        board: 'bseb',
        language: 'english',
        subject: 'chemistry',
        class: '10',
        year: 2022,
        question: 'Which of the following is a balanced equation?',
        options: [
            'H2 + O2 -> H2O',
            '2H2 + O2 -> 2H2O',
            'H2 + 2O2 -> 2H2O',
            '2H2 + 2O2 -> 2H2O'
        ],
        correctAnswer: 1,
        chapter: 'Chemical Reactions',
        topic: 'Balancing Equations',
        difficulty: 'easy',
        marks: 1,
        questionType: 'mcq',
        explanation: '2H2 + O2 -> 2H2O is balanced.',
        tags: ['Equations']
    },

    // Mathematics Questions
    {
        id: 'm1',
        board: 'bseb',
        language: 'english',
        subject: 'mathematics',
        class: '10',
        year: 2023,
        question: 'The sum of the first n natural numbers is:',
        options: ['n(n+1)', 'n(n-1)/2', 'n(n+1)/2', 'n^2'],
        correctAnswer: 2,
        chapter: 'Arithmetic Progression',
        topic: 'Sum of Series',
        difficulty: 'medium',
        marks: 1,
        questionType: 'mcq',
        explanation: 'Sum of first n natural numbers = n(n+1)/2',
        tags: ['Series', 'Formulas']
    },
    {
        id: 'm2',
        board: 'bseb',
        language: 'english',
        subject: 'mathematics',
        class: '10',
        year: 2022,
        question: 'If sin A = 3/5, then value of tan A is?',
        options: ['4/3', '3/4', '3/5', '4/5'],
        correctAnswer: 1,
        chapter: 'Trigonometry',
        topic: 'Ratios',
        difficulty: 'hard',
        marks: 1,
        questionType: 'mcq',
        explanation: 'Sin A = P/H = 3/5 => B = 4. Tan A = P/B = 3/4.',
        tags: ['Trigonometry']
    },

    // Biology Questions
    {
        id: 'b1',
        board: 'bseb',
        language: 'english',
        subject: 'biology',
        class: '10',
        year: 2023,
        question: 'The breakdown of pyruvate to give carbon dioxide, water and energy takes place in:',
        options: ['Cytoplasm', 'Mitochondria', 'Chloroplast', 'Nucleus'],
        correctAnswer: 1,
        chapter: 'Life Processes',
        topic: 'Respiration',
        difficulty: 'medium',
        marks: 1,
        questionType: 'mcq',
        explanation: 'Aerobic respiration takes place in Mitochondria.',
        tags: ['Respiration', 'Cells']
    }
]

export const getQuestions = (subject?: string) => {
    if (!subject) return mockQuestions;
    return mockQuestions.filter(q => q.subject === subject);
}
