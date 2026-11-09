import type { Question } from './types';

/**
 * Original Andaaza question bank. Answers are the best public figures known at
 * writing time; anything marked medium/low confidence must be re-verified
 * against the named source before a public launch.
 */
export const QUESTIONS: Question[] = [
  {
    id: 'a001',
    prompt: 'How many villages did the 2011 Census count in India?',
    answer: 640_867,
    unit: { label: 'villages' },
    category: 'people',
    emoji: '🏡',
    source: 'Census of India 2011, Office of the Registrar General',
    asOf: '2011',
    confidence: 'high',
    note: 'Includes uninhabited villages; about 5.98 lakh were inhabited.',
    napkin: {
      lead: 'Start from the rural population and guess how many people live in a typical village.',
      steps: [
        ['India in 2011', '~121 crore people'],
        ['Share living in villages', '~69% → ~83 crore'],
        ['People in an average village', '~1,300'],
        ['83 crore ÷ 1,300', '≈ 6.4 lakh villages']
      ],
      estimate: 640_000
    }
  },
  {
    id: 'a002',
    prompt: 'How many votes were cast in the 2024 Lok Sabha election?',
    answer: 642_000_000,
    unit: { label: 'votes' },
    category: 'civic',
    emoji: '🗳️',
    source: 'Election Commission of India',
    asOf: '2024',
    confidence: 'high',
    note: 'ECI called it a world record: about 64.2 crore voters turned out.',
    napkin: {
      lead: 'Take the number of adults on the rolls and apply a typical turnout.',
      steps: [
        ['Population', '~144 crore'],
        ['Registered voters (adults on rolls)', '~97 crore'],
        ['Turnout', '~66%'],
        ['97 crore × 0.66', '≈ 64 crore votes']
      ],
      estimate: 640_000_000
    }
  },
  {
    id: 'a003',
    prompt: 'How many polling stations were set up for the 2024 Lok Sabha election?',
    answer: 1_050_000,
    unit: { label: 'polling stations' },
    category: 'civic',
    emoji: '🏫',
    source: 'Election Commission of India',
    asOf: '2024',
    confidence: 'high',
    note: 'ECI rounded figure: about 10.5 lakh polling stations.',
    napkin: {
      lead: 'Rules aim to keep each booth small enough to vote through in one day.',
      steps: [
        ['Registered voters', '~97 crore'],
        ['Voters per booth (rule of thumb)', '~900–1,000'],
        ['97 crore ÷ 950', '≈ 10 lakh booths']
      ],
      estimate: 1_020_000
    }
  },
  {
    id: 'a004',
    prompt: "How many Qutub Minars stacked on top of each other would match the height of the Statue of Unity's figure?",
    answer: 182 / 72.5,
    unit: { label: 'Qutub Minars' },
    category: 'heritage',
    emoji: '🗿',
    source: 'Statue of Unity: 182 m (Govt. of Gujarat); Qutub Minar: 72.5 m (ASI)',
    asOf: '2018',
    confidence: 'high',
    note: 'Figure only. With its base the Statue of Unity reaches about 240 m.',
    napkin: {
      lead: 'Compare both to a building you know: one storey is about 3 metres.',
      steps: [
        ['Qutub Minar', '~24 storeys ≈ 72 m'],
        ['Statue of Unity', '~60 storeys ≈ 180 m'],
        ['180 ÷ 72', '≈ 2.5']
      ],
      estimate: 2.5
    }
  },
  {
    id: 'a005',
    prompt: 'How many international runs did Sachin Tendulkar score across Tests, ODIs and T20Is?',
    answer: 34_357,
    unit: { label: 'runs' },
    category: 'cricket',
    emoji: '🏏',
    source: 'ESPNcricinfo career records',
    asOf: '2013',
    confidence: 'high',
    note: '15,921 Test + 18,426 ODI + 10 T20I runs.',
    napkin: {
      lead: 'Split it into Tests and ODIs: matches × innings × average.',
      steps: [
        ['Tests: 200 matches × ~1.6 innings × ~54 avg', '≈ 17,000'],
        ['ODIs: 463 matches × ~45 avg', '≈ 20,000'],
        ['Allow for not-outs and missed innings', '≈ −10%'],
        ['Total', '≈ 33,000 runs']
      ],
      estimate: 33_000
    }
  },
  {
    id: 'a006',
    prompt: 'How long is the Indian Railways network, measured in route kilometres?',
    answer: 68_584,
    unit: { label: 'km' },
    category: 'rail',
    emoji: '🚆',
    source: 'Indian Railways Year Book',
    asOf: '2023',
    confidence: 'medium',
    note: 'Route km counts a double-track line once. Running-track km is roughly 1.6× higher.',
    napkin: {
      lead: 'Think of India as a grid of lines a few hundred kilometres apart.',
      steps: [
        ['India is roughly', '3,000 km × 3,000 km'],
        ['Imagine N–S and E–W lines every ~100 km', '~30 lines each way'],
        ['Not all are built: say ~35% coverage', '60 lines × 3,000 km × 0.35'],
        ['Total', '≈ 63,000 km']
      ],
      estimate: 63_000
    }
  },
  {
    id: 'a007',
    prompt: "How many spectators can Ahmedabad's Narendra Modi Stadium seat?",
    answer: 132_000,
    unit: { label: 'seats' },
    category: 'cricket',
    emoji: '🏟️',
    source: 'Gujarat Cricket Association',
    asOf: '2020',
    confidence: 'high',
    note: 'The largest cricket stadium in the world by capacity.',
    napkin: {
      lead: 'Walk around the stands: rows × seats per row.',
      steps: [
        ['Outer circumference of seating', '~800 m'],
        ['Seat width', '~0.5 m → ~1,600 seats per ring'],
        ['Rows across the tiers', '~80'],
        ['1,600 × 80', '≈ 1.3 lakh seats']
      ],
      estimate: 128_000
    }
  },
  {
    id: 'a008',
    prompt: "Roughly how many lunch tiffins do Mumbai's dabbawalas deliver on a working day?",
    answer: 200_000,
    unit: { label: 'tiffins' },
    category: 'food',
    emoji: '🍱',
    source: 'Nutan Mumbai Tiffin Box Suppliers Charity Trust (dabbawala association)',
    asOf: '2019',
    confidence: 'medium',
    note: 'Widely quoted pre-pandemic figure: about 5,000 dabbawalas, 2 lakh tiffins. Volumes fell after 2020.',
    napkin: {
      lead: 'Count the people and how many boxes each one carries.',
      steps: [
        ['Dabbawalas', '~5,000'],
        ['Tiffins per person (picked up and dropped)', '~40'],
        ['5,000 × 40', '≈ 2 lakh tiffins']
      ],
      estimate: 200_000
    }
  },
  {
    id: 'a009',
    prompt: 'How many verses (shlokas) are there in the Bhagavad Gita?',
    answer: 700,
    unit: { label: 'verses' },
    category: 'culture',
    emoji: '📜',
    source: 'Standard recension of the Bhagavad Gita',
    asOf: 'Traditional',
    confidence: 'high',
    napkin: {
      lead: 'Chapters × verses per chapter.',
      steps: [
        ['Chapters', '18'],
        ['Verses per chapter (some short, some long)', '~40'],
        ['18 × 40', '≈ 720 verses']
      ],
      estimate: 720
    }
  },
  {
    id: 'a010',
    prompt: 'How many wild tigers were estimated to live in India in the 2022 tiger census?',
    answer: 3_682,
    unit: { label: 'tigers' },
    category: 'nature',
    emoji: '🐅',
    source: 'All India Tiger Estimation 2022 (NTCA / WII)',
    asOf: '2022',
    confidence: 'high',
    note: 'Mean estimate. The minimum count from camera traps was 3,167. About three-quarters of the world’s wild tigers.',
    napkin: {
      lead: 'Reserves × tigers per reserve, plus some outside reserves.',
      steps: [
        ['Tiger reserves', '~55'],
        ['Average tigers per reserve', '~50'],
        ['Tigers outside reserves', '~+30%'],
        ['55 × 50 × 1.3', '≈ 3,600 tigers']
      ],
      estimate: 3_600
    }
  },
  {
    id: 'a011',
    prompt: 'What did the Chandrayaan-3 Moon mission cost, in rupees?',
    answer: 6_150_000_000,
    unit: { label: '', prefix: '₹' },
    category: 'space',
    emoji: '🌕',
    source: 'Widely reported ISRO/Department of Space estimate',
    asOf: '2023',
    confidence: 'medium',
    note: 'About ₹615 crore, cheaper than many Hollywood space films.',
    napkin: {
      lead: 'Big-budget Indian film × a few, or engineers × salary × years.',
      steps: [
        ['Engineers and scientists involved', '~1,000'],
        ['Cost per person-year incl. overheads', '~₹25 lakh'],
        ['Years of work', '~4 → ₹100 crore'],
        ['Rocket + lander + rover hardware', '~₹450 crore'],
        ['Total', '≈ ₹550 crore']
      ],
      estimate: 5_500_000_000
    }
  },
  {
    id: 'a012',
    prompt: 'How long is the Golden Quadrilateral highway linking Delhi, Mumbai, Chennai and Kolkata?',
    answer: 5_846,
    unit: { label: 'km' },
    category: 'roads',
    emoji: '🛣️',
    source: 'National Highways Authority of India',
    asOf: '2012',
    confidence: 'high',
    napkin: {
      lead: 'Add up the four sides of the loop.',
      steps: [
        ['Delhi → Mumbai', '~1,400 km'],
        ['Mumbai → Chennai', '~1,300 km'],
        ['Chennai → Kolkata', '~1,650 km'],
        ['Kolkata → Delhi', '~1,450 km'],
        ['Total', '≈ 5,800 km']
      ],
      estimate: 5_800
    }
  },
  {
    id: 'a013',
    prompt: "How far is it from India's northernmost point to its southern tip, in a straight line north to south?",
    answer: 3_214,
    unit: { label: 'km' },
    category: 'nature',
    emoji: '🧭',
    source: 'Government of India (official north–south extent)',
    asOf: 'Current',
    confidence: 'high',
    napkin: {
      lead: 'Use latitude: one degree is about 111 km.',
      steps: [
        ['Southern tip of the mainland', '~8° N'],
        ['Northern limit', '~37° N'],
        ['29 degrees × 111 km', '≈ 3,200 km']
      ],
      estimate: 3_220
    }
  },
  {
    id: 'a014',
    prompt: 'How many cattle (cows, bulls and oxen) did the 2019 Livestock Census count in India?',
    answer: 192_490_000,
    unit: { label: 'cattle' },
    category: 'food',
    emoji: '🐄',
    source: '20th Livestock Census, Dept. of Animal Husbandry & Dairying',
    asOf: '2019',
    confidence: 'high',
    note: 'About 19.2 crore cattle. Buffaloes, counted separately, add about 11 crore more.',
    napkin: {
      lead: 'Rural households × cattle per household.',
      steps: [
        ['Rural households', '~18 crore'],
        ['Share keeping cattle', '~40%'],
        ['Cattle per such household', '~2.5'],
        ['18 crore × 0.4 × 2.5', '≈ 18 crore cattle']
      ],
      estimate: 180_000_000
    }
  },
  {
    id: 'a015',
    prompt: "Roughly how many vehicles cross Kolkata's Howrah Bridge on a typical day?",
    answer: 100_000,
    unit: { label: 'vehicles' },
    category: 'roads',
    emoji: '🌉',
    source: 'Kolkata Port Trust (Syama Prasad Mookerjee Port) estimates',
    asOf: '2010s',
    confidence: 'medium',
    note: 'Commonly cited as over 1 lakh vehicles plus about 1.5 lakh pedestrians a day.',
    napkin: {
      lead: 'Lanes × vehicles per lane per hour × busy hours.',
      steps: [
        ['Lanes (both directions)', '~6'],
        ['Vehicles per lane per busy hour', '~1,000'],
        ['Busy-hour equivalent per day', '~16'],
        ['6 × 1,000 × 16', '≈ 1 lakh vehicles']
      ],
      estimate: 96_000
    }
  },
  {
    id: 'a016',
    prompt: 'How many platforms does Howrah Junction, India’s busiest railway complex, have?',
    answer: 23,
    unit: { label: 'platforms' },
    category: 'rail',
    emoji: '🚉',
    source: 'Eastern Railway',
    asOf: '2024',
    confidence: 'high',
    note: 'The most platforms of any station in India.',
    napkin: {
      lead: 'Trains per day ÷ trains one platform can handle.',
      steps: [
        ['Trains handled daily (long-distance + suburban)', '~950'],
        ['Trains per platform per day (~25 min each)', '~45'],
        ['950 ÷ 45', '≈ 21 platforms']
      ],
      estimate: 21
    }
  },
  {
    id: 'a017',
    prompt: 'How many visits did the Uttar Pradesh government say the 2025 Maha Kumbh at Prayagraj received over its 45 days?',
    answer: 660_000_000,
    unit: { label: 'visits' },
    category: 'culture',
    emoji: '🪔',
    source: 'Government of Uttar Pradesh (official closing figure)',
    asOf: '2025',
    confidence: 'medium',
    note: 'Official claim of about 66 crore holy dips. Counting methods (cameras, sampling) are debated and many people visited more than once.',
    napkin: {
      lead: 'Daily footfall × 45 days, with spikes on bathing days.',
      steps: [
        ['Ordinary day', '~1 crore visits'],
        ['Six big snan days', '~4–8 crore each → ~30 crore'],
        ['39 ordinary days × 1 crore', '~39 crore'],
        ['Total', '≈ 69 crore visits']
      ],
      estimate: 690_000_000
    }
  },
  {
    id: 'a018',
    prompt: 'How tall is India Gate in New Delhi, in metres?',
    answer: 42,
    unit: { label: 'metres' },
    category: 'heritage',
    emoji: '🏛️',
    source: 'Ministry of Culture / CPWD',
    asOf: 'Current',
    confidence: 'high',
    napkin: {
      lead: 'Count storeys of a building you’d compare it with.',
      steps: [
        ['Looks about as tall as a', '13–14 storey building'],
        ['Storey height', '~3 m'],
        ['14 × 3', '≈ 42 m']
      ],
      estimate: 42
    }
  },
  {
    id: 'a019',
    prompt: 'What did the Mangalyaan (Mars Orbiter Mission) cost, in rupees?',
    answer: 4_500_000_000,
    unit: { label: '', prefix: '₹' },
    category: 'space',
    emoji: '🔴',
    source: 'ISRO / Department of Space',
    asOf: '2013',
    confidence: 'high',
    note: 'About ₹450 crore, roughly ₹7 per Indian at the time.',
    napkin: {
      lead: 'A PSLV launch plus a small spacecraft and a few years of team time.',
      steps: [
        ['PSLV-XL launch', '~₹110 crore'],
        ['Orbiter hardware', '~₹150 crore'],
        ['Ground stations, deep space network, team', '~₹200 crore'],
        ['Total', '≈ ₹460 crore']
      ],
      estimate: 4_600_000_000
    }
  },
  {
    id: 'a020',
    prompt: 'How many passenger trains does Indian Railways run on an average day?',
    answer: 13_000,
    unit: { label: 'trains' },
    category: 'rail',
    emoji: '🚂',
    source: 'Ministry of Railways',
    asOf: '2023',
    confidence: 'medium',
    note: 'Rounded official figure ("over 13,000"), including suburban services.',
    napkin: {
      lead: 'Stations × trains starting there, or passengers ÷ passengers per train.',
      steps: [
        ['Passengers per day', '~2 crore'],
        ['Average passengers per train trip', '~1,500'],
        ['2 crore ÷ 1,500', '≈ 13,000 trains']
      ],
      estimate: 13_300
    }
  },
  {
    id: 'a021',
    prompt: 'Roughly how many people work for Indian Railways?',
    answer: 1_200_000,
    unit: { label: 'employees' },
    category: 'rail',
    emoji: '👷',
    source: 'Ministry of Railways',
    asOf: '2023',
    confidence: 'medium',
    note: 'About 12 lakh regular employees, one of the largest employers in the world.',
    napkin: {
      lead: 'Staff per route-kilometre, plus stations and workshops.',
      steps: [
        ['Route km', '~68,000'],
        ['Track, signal and operations staff per km', '~10'],
        ['Stations × staff (~7,300 × 60)', '~4.4 lakh'],
        ['6.8 lakh + 4.4 lakh', '≈ 11 lakh']
      ],
      estimate: 1_120_000
    }
  },
  {
    id: 'a022',
    prompt: 'How many rooms does Rashtrapati Bhavan have?',
    answer: 340,
    unit: { label: 'rooms' },
    category: 'heritage',
    emoji: '🏰',
    source: 'President’s Secretariat',
    asOf: 'Current',
    confidence: 'high',
    napkin: {
      lead: 'Floor area ÷ size of a grand room.',
      steps: [
        ['Built-up floor area', '~2 lakh sq ft'],
        ['Share that is rooms (not corridors, courtyards)', '~50%'],
        ['Average room', '~300 sq ft'],
        ['1 lakh ÷ 300', '≈ 330 rooms']
      ],
      estimate: 330
    }
  },
  {
    id: 'a023',
    prompt: 'How many seats are there in the Lok Sabha chamber of the new Parliament building?',
    answer: 888,
    unit: { label: 'seats' },
    category: 'civic',
    emoji: '🏛️',
    source: 'Lok Sabha Secretariat',
    asOf: '2023',
    confidence: 'high',
    note: 'Room for 888 so it can host joint sittings and future seat increases (543 MPs today).',
    napkin: {
      lead: 'Today’s MPs plus room for growth.',
      steps: [
        ['Lok Sabha MPs today', '543'],
        ['Planned future expansion', '~+60%'],
        ['543 × 1.6', '≈ 870 seats']
      ],
      estimate: 870
    }
  },
  {
    id: 'a024',
    prompt: 'How many shlokas are traditionally said to be in Valmiki’s Ramayana?',
    answer: 24_000,
    unit: { label: 'shlokas' },
    category: 'culture',
    emoji: '🏹',
    source: 'Traditional count (Valmiki Ramayana)',
    asOf: 'Traditional',
    confidence: 'high',
    note: 'Critical editions come in slightly lower.',
    napkin: {
      lead: 'Books × chapters × verses.',
      steps: [
        ['Kandas (books)', '7'],
        ['Sargas (chapters) in all', '~500'],
        ['Shlokas per sarga', '~48'],
        ['500 × 48', '≈ 24,000']
      ],
      estimate: 24_000
    }
  },
  {
    id: 'a025',
    prompt: "How many seconds does the full version of 'Jana Gana Mana' take to sing?",
    answer: 52,
    unit: { label: 'seconds' },
    category: 'culture',
    emoji: '🇮🇳',
    source: 'Ministry of Home Affairs: orders relating to the National Anthem',
    asOf: 'Current',
    confidence: 'high',
    napkin: {
      lead: 'Hum it in your head: lines × seconds per line.',
      steps: [
        ['Lines in the anthem', '~13'],
        ['Seconds per line', '~4'],
        ['13 × 4', '≈ 52 seconds']
      ],
      estimate: 52
    }
  },
  {
    id: 'a026',
    prompt: 'How many one-horned rhinos were counted in Kaziranga National Park in 2022?',
    answer: 2_613,
    unit: { label: 'rhinos' },
    category: 'nature',
    emoji: '🦏',
    source: 'Kaziranga National Park rhino census, Govt. of Assam',
    asOf: '2022',
    confidence: 'high',
    note: 'About two-thirds of all greater one-horned rhinos in the world.',
    napkin: {
      lead: 'Grassland area × density.',
      steps: [
        ['Park core area', '~430 sq km'],
        ['Share that is rhino grassland', '~65% → ~280 sq km'],
        ['Rhinos per sq km of grassland', '~9'],
        ['280 × 9', '≈ 2,500 rhinos']
      ],
      estimate: 2_500
    }
  },
  {
    id: 'a027',
    prompt: 'How many Asiatic lions were counted in Gujarat in the 2025 lion census?',
    answer: 891,
    unit: { label: 'lions' },
    category: 'nature',
    emoji: '🦁',
    source: 'Gujarat Forest Department, 16th Asiatic Lion Population Estimation',
    asOf: '2025',
    confidence: 'medium',
    note: 'Up from 674 in 2020. Gir and the wider Saurashtra landscape are the only wild home of the Asiatic lion.',
    napkin: {
      lead: 'Prides × lions per pride, plus wanderers.',
      steps: [
        ['Prides across Saurashtra', '~120'],
        ['Lions per pride (incl. cubs)', '~6'],
        ['Nomadic males and loners', '~+20%'],
        ['120 × 6 × 1.2', '≈ 860 lions']
      ],
      estimate: 860
    }
  },
  {
    id: 'a028',
    prompt: 'How long is the Ganga, from Gangotri glacier to the Bay of Bengal?',
    answer: 2_525,
    unit: { label: 'km' },
    category: 'nature',
    emoji: '🌊',
    source: 'National Mission for Clean Ganga',
    asOf: 'Current',
    confidence: 'high',
    napkin: {
      lead: 'Straight-line distance × a wiggle factor for meanders.',
      steps: [
        ['Gangotri → Ganga Sagar, straight line', '~1,750 km'],
        ['Rivers on plains wander', '× ~1.4'],
        ['1,750 × 1.4', '≈ 2,450 km']
      ],
      estimate: 2_450
    }
  },
  {
    id: 'a029',
    prompt: "How long is Mumbai's Atal Setu (Mumbai Trans Harbour Link), India's longest sea bridge?",
    answer: 21.8,
    unit: { label: 'km' },
    category: 'roads',
    emoji: '🌉',
    source: 'MMRDA',
    asOf: '2024',
    confidence: 'high',
    note: 'About 16.5 km of it runs over the sea.',
    napkin: {
      lead: 'Drive time at highway speed.',
      steps: [
        ['Sewri to Chirle at 100 km/h', '~13 minutes'],
        ['13 min × 100 km/h', '≈ 22 km']
      ],
      estimate: 22
    }
  },
  {
    id: 'a030',
    prompt: 'How high above the river does the Chenab rail bridge in Jammu & Kashmir stand?',
    answer: 359,
    unit: { label: 'metres' },
    category: 'rail',
    emoji: '🌁',
    source: 'Northern Railway / Konkan Railway Corporation',
    asOf: '2025',
    confidence: 'high',
    note: 'The world’s highest railway arch bridge, taller than the Eiffel Tower’s roof.',
    napkin: {
      lead: 'Compare it to something famous.',
      steps: [
        ['Known: taller than the Eiffel Tower', '~330 m'],
        ['A bit more for clearance', '+ ~10%'],
        ['330 × 1.1', '≈ 360 m']
      ],
      estimate: 360
    }
  },
  {
    id: 'a031',
    prompt: "How many Statues of Unity (182 m) stacked up would reach the top of Mount Everest from sea level?",
    answer: 8_849 / 182,
    unit: { label: 'statues' },
    category: 'nature',
    emoji: '🏔️',
    source: 'Everest: 8,848.86 m (Nepal–China survey 2020); Statue: 182 m',
    asOf: '2020',
    confidence: 'high',
    napkin: {
      lead: 'Everest ÷ statue height.',
      steps: [
        ['Everest', '~8,850 m'],
        ['Statue of Unity', '~180 m'],
        ['8,850 ÷ 180', '≈ 49 statues']
      ],
      estimate: 49
    }
  },
  {
    id: 'a032',
    prompt: "How long is India's coastline, according to the government's 2024–25 re-measurement?",
    answer: 11_098.81,
    unit: { label: 'km' },
    category: 'nature',
    emoji: '🏖️',
    source: 'Ministry of Home Affairs / National Hydrographic Office',
    asOf: '2025',
    confidence: 'medium',
    note: 'The older official figure was 7,516.6 km. New methods trace the coast in finer detail, so it grew.',
    napkin: {
      lead: 'Mainland coast plus two island chains, then add wiggles.',
      steps: [
        ['Gujarat to Kanyakumari to Bengal, smoothed', '~5,500 km'],
        ['Andaman, Nicobar & Lakshadweep', '~2,000 km'],
        ['Fine-scale bays and creeks', '× ~1.45'],
        ['7,500 × 1.45', '≈ 10,900 km']
      ],
      estimate: 10_900
    }
  },
  {
    id: 'a033',
    prompt: 'How long is India’s national highway network?',
    answer: 146_000,
    unit: { label: 'km' },
    category: 'roads',
    emoji: '🛣️',
    source: 'Ministry of Road Transport & Highways',
    asOf: '2024',
    confidence: 'medium',
    note: 'About 1.46 lakh km. Up from about 91,000 km in 2014.',
    napkin: {
      lead: 'Area × highway density.',
      steps: [
        ['India’s land area', '~33 lakh sq km'],
        ['National highway per 100 sq km', '~4.5 km'],
        ['33,000 × 4.5', '≈ 1.5 lakh km']
      ],
      estimate: 148_500
    }
  },
  {
    id: 'a034',
    prompt: "In December 2014, 'Dilwale Dulhania Le Jayenge' hit a milestone at Mumbai's Maratha Mandir. For how many weeks had it run there without a break?",
    answer: 1_000,
    unit: { label: 'weeks' },
    category: 'cinema',
    emoji: '🎬',
    source: 'Maratha Mandir / Yash Raj Films',
    asOf: '2014',
    confidence: 'high',
    note: 'Released October 1995. It kept running on a matinee slot well after that.',
    napkin: {
      lead: 'Years since release × weeks per year.',
      steps: [
        ['Oct 1995 → Dec 2014', '~19.2 years'],
        ['Weeks per year', '52'],
        ['19.2 × 52', '≈ 1,000 weeks']
      ],
      estimate: 1_000
    }
  },
  {
    id: 'a035',
    prompt: 'How many ODIs did Sachin Tendulkar play?',
    answer: 463,
    unit: { label: 'matches' },
    category: 'cricket',
    emoji: '🏏',
    source: 'ESPNcricinfo career records',
    asOf: '2012',
    confidence: 'high',
    napkin: {
      lead: 'Career length × ODIs India played per year × share he played.',
      steps: [
        ['ODI career', '1989 → 2012, ~23 years'],
        ['ODIs India played per year', '~28'],
        ['Share he played (injuries, rest)', '~70%'],
        ['23 × 28 × 0.7', '≈ 450 matches']
      ],
      estimate: 450
    }
  },
  {
    id: 'a036',
    prompt: 'What was India’s population at the 2011 Census?',
    answer: 1_210_854_977,
    unit: { label: 'people' },
    category: 'people',
    emoji: '👨‍👩‍👧‍👦',
    source: 'Census of India 2011',
    asOf: '2011',
    confidence: 'high',
    napkin: {
      lead: 'Work back from today with growth of about 1% a year.',
      steps: [
        ['Today', '~145 crore'],
        ['Growth 2011 → today', '~1.1% a year for ~14 years → × 1.17'],
        ['145 ÷ 1.17', '≈ 124 crore']
      ],
      estimate: 1_240_000_000
    }
  },
  {
    id: 'a037',
    prompt: 'How many years did it take to build the Taj Mahal complex?',
    answer: 22,
    unit: { label: 'years' },
    category: 'heritage',
    emoji: '🕌',
    source: 'Archaeological Survey of India',
    asOf: '1632–1653',
    confidence: 'medium',
    note: 'The mausoleum was largely done by 1643; the gardens, mosque and gateway took about another decade.',
    napkin: {
      lead: 'Marble volume ÷ how fast a big workforce could carve and place it.',
      steps: [
        ['Main tomb itself', '~10 years'],
        ['Mosque, guest house, gateway, gardens', '~+10 years'],
        ['Total', '≈ 20 years']
      ],
      estimate: 20
    }
  },
  {
    id: 'a038',
    prompt: 'How many UPI transactions were made in India in August 2025?',
    answer: 20_010_000_000,
    unit: { label: 'transactions' },
    category: 'money',
    emoji: '📱',
    source: 'NPCI monthly UPI statistics',
    asOf: 'Aug 2025',
    confidence: 'medium',
    note: 'The first month UPI crossed 20 billion (2,000 crore) transactions.',
    napkin: {
      lead: 'Users × payments per day × days.',
      steps: [
        ['Active UPI users', '~40 crore'],
        ['Payments per user per day', '~1.6'],
        ['Days in August', '31'],
        ['40 crore × 1.6 × 31', '≈ 2,000 crore']
      ],
      estimate: 19_840_000_000
    }
  },
  {
    id: 'a039',
    prompt: 'Roughly how many people eat at the Golden Temple’s langar in Amritsar on an ordinary day?',
    answer: 100_000,
    unit: { label: 'people' },
    category: 'food',
    emoji: '🍛',
    source: 'Shiromani Gurdwara Parbandhak Committee (SGPC)',
    asOf: '2020s',
    confidence: 'medium',
    note: 'Figures range from 50,000 to 1 lakh+ on normal days, and can double on festivals.',
    napkin: {
      lead: 'Hall capacity × sittings per day.',
      steps: [
        ['People per sitting in the halls', '~5,000'],
        ['Sittings, close to round the clock', '~20'],
        ['5,000 × 20', '≈ 1 lakh people']
      ],
      estimate: 100_000
    }
  },
  {
    id: 'a040',
    prompt: 'How many passenger journeys do Mumbai’s suburban local trains carry on a typical weekday?',
    answer: 7_500_000,
    unit: { label: 'journeys' },
    category: 'rail',
    emoji: '🚃',
    source: 'Central Railway & Western Railway',
    asOf: '2019',
    confidence: 'medium',
    note: 'Pre-pandemic figure of about 75 lakh. It has been somewhat lower since.',
    napkin: {
      lead: 'Services × riders per service.',
      steps: [
        ['Local train services per day (all lines)', '~3,000'],
        ['Average riders per service', '~2,500'],
        ['3,000 × 2,500', '≈ 75 lakh']
      ],
      estimate: 7_500_000
    }
  },
  {
    id: 'a041',
    prompt: 'How much milk did India produce in 2023–24, in tonnes?',
    answer: 239_300_000,
    unit: { label: 'tonnes' },
    category: 'food',
    emoji: '🥛',
    source: 'Basic Animal Husbandry Statistics 2024, Govt. of India',
    asOf: '2023–24',
    confidence: 'medium',
    note: 'About 23.9 crore tonnes. India is the world’s largest milk producer.',
    napkin: {
      lead: 'People × milk per person per day × 365.',
      steps: [
        ['Population', '~144 crore'],
        ['Milk available per person per day', '~450 g'],
        ['144 crore × 0.45 kg × 365', '≈ 23.6 crore tonnes']
      ],
      estimate: 236_000_000
    }
  },
  {
    id: 'a042',
    prompt: 'How many sixes were hit in the 2024 IPL season?',
    answer: 1_260,
    unit: { label: 'sixes' },
    category: 'cricket',
    emoji: '💥',
    source: 'IPL / ESPNcricinfo season records',
    asOf: '2024',
    confidence: 'medium',
    note: 'A record at the time, helped by the impact-player rule.',
    napkin: {
      lead: 'Matches × innings × sixes per innings.',
      steps: [
        ['Matches in the season', '~74'],
        ['Innings per match', '2'],
        ['Sixes per innings', '~8.5'],
        ['74 × 2 × 8.5', '≈ 1,260 sixes']
      ],
      estimate: 1_260
    }
  },
  {
    id: 'a043',
    prompt: "How many earthen diyas were lit together on Ayodhya's ghats for Deepotsav 2024, setting a Guinness World Record?",
    answer: 2_512_585,
    unit: { label: 'diyas' },
    category: 'culture',
    emoji: '🪔',
    source: 'Guinness World Records / Govt. of Uttar Pradesh',
    asOf: '2024',
    confidence: 'medium',
    note: 'Counted by drone. The record is broken almost every year.',
    napkin: {
      lead: 'Ghat area × diyas per square metre.',
      steps: [
        ['Ghats used along the Saryu', '~55 ghats'],
        ['Diyas per ghat', '~45,000'],
        ['55 × 45,000', '≈ 25 lakh diyas']
      ],
      estimate: 2_475_000
    }
  },
  {
    id: 'a044',
    prompt: 'The 2011 Census recorded thousands of mother tongues. Into how many languages were they finally grouped?',
    answer: 121,
    unit: { label: 'languages' },
    category: 'culture',
    emoji: '🗣️',
    source: 'Census of India 2011, Language Atlas',
    asOf: '2011',
    confidence: 'high',
    note: '22 scheduled languages plus 99 non-scheduled ones with at least 10,000 speakers.',
    napkin: {
      lead: 'States × major languages, plus tribal languages.',
      steps: [
        ['Scheduled languages', '22'],
        ['Tribal and regional languages with 10k+ speakers', '~100'],
        ['22 + 100', '≈ 120 languages']
      ],
      estimate: 120
    }
  },
  {
    id: 'a045',
    prompt: 'In 2017 ISRO launched a world-record number of satellites on a single rocket (PSLV-C37). How many?',
    answer: 104,
    unit: { label: 'satellites' },
    category: 'space',
    emoji: '🛰️',
    source: 'ISRO',
    asOf: '2017',
    confidence: 'high',
    note: 'Most were tiny Earth-imaging cubesats for a US company.',
    napkin: {
      lead: 'Spare payload mass ÷ mass of a tiny satellite.',
      steps: [
        ['Main satellite', '~700 kg'],
        ['Spare capacity for small satellites', '~650 kg'],
        ['A cubesat', '~5 kg → ~130 max'],
        ['Allow for dispensers and spacing', '≈ 100 satellites']
      ],
      estimate: 100
    }
  },
  {
    id: 'a046',
    prompt: 'How far, in metres, did the Pragyan rover drive on the Moon during the Chandrayaan-3 mission?',
    answer: 101.4,
    unit: { label: 'metres' },
    category: 'space',
    emoji: '🤖',
    source: 'ISRO',
    asOf: '2023',
    confidence: 'medium',
    napkin: {
      lead: 'Speed × driving time over one lunar daylight.',
      steps: [
        ['Rover speed', '~1 cm/s'],
        ['Days of operation', '~10'],
        ['Actual driving time per day (careful, slow)', '~20 min'],
        ['1 cm/s × 1,200 s × 10', '≈ 120 m']
      ],
      estimate: 120
    }
  },
  {
    id: 'a047',
    prompt: 'How many articles did the Constitution of India have when it came into force in 1950?',
    answer: 395,
    unit: { label: 'articles' },
    category: 'civic',
    emoji: '📘',
    source: 'Constitution of India (original text)',
    asOf: '1950',
    confidence: 'high',
    note: 'Arranged in 22 parts and 8 schedules. Amendments have since added many more.',
    napkin: {
      lead: 'Parts × articles per part.',
      steps: [
        ['Parts', '22'],
        ['Articles per part', '~18'],
        ['22 × 18', '≈ 400 articles']
      ],
      estimate: 396
    }
  },
  {
    id: 'a048',
    prompt: 'Roughly how many post offices does India Post run?',
    answer: 164_972,
    unit: { label: 'post offices' },
    category: 'civic',
    emoji: '📮',
    source: 'Department of Posts annual report',
    asOf: '2024',
    confidence: 'medium',
    note: 'About 1.65 lakh, the largest postal network in the world. Most are rural branch post offices.',
    napkin: {
      lead: 'Villages ÷ villages served by one branch.',
      steps: [
        ['Villages', '~6.4 lakh'],
        ['Villages served per branch post office', '~4.3'],
        ['6.4 lakh ÷ 4.3', '≈ 1.5 lakh'],
        ['Plus urban post offices', '≈ +15,000'],
        ['Total', '≈ 1.65 lakh']
      ],
      estimate: 165_000
    }
  }
];

export const QUESTION_BY_ID: Map<string, Question> = new Map(QUESTIONS.map((q) => [q.id, q]));
