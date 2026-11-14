/**
 * Learning Center content. Written in plain language from public NASA material.
 * Each topic ends with how LUNARA simplifies the real science.
 */

export interface LearningSource {
  label: string;
  url?: string;
}

export interface LearningTopic {
  id: string;
  title: string;
  summary: string;
  sections: { heading: string; body: string }[];
  inGame: string;
  sources: LearningSource[];
}

const SRC = {
  moon: { label: 'NASA Science: Earth’s Moon', url: 'https://science.nasa.gov/moon/' },
  moonBase: { label: 'NASA: Moon base frequently asked questions', url: 'https://www.nasa.gov/moon-base-frequently-asked-questions/' },
  donki: { label: 'NASA CCMC: DONKI space weather database', url: 'https://ccmc.gsfc.nasa.gov/DONKI/' },
  trek: { label: 'NASA Moon Trek', url: 'https://trek.nasa.gov/moon/' },
  issWater: { label: 'NASA space station life support update on 98% water recovery (June 2023)' },
  veggie: { label: 'NASA Veggie plant growth experiments aboard the space station' },
  fsp: { label: 'NASA Fission Surface Power project' },
} satisfies Record<string, LearningSource>;

export const LEARNING_TOPICS: LearningTopic[] = [
  {
    id: 'lunar-environment',
    title: 'The lunar environment',
    summary: 'Airless, dusty, scorching by day, freezing by night.',
    sections: [
      {
        heading: 'Almost no air',
        body: 'The Moon has only an extremely thin exosphere, not a real atmosphere. There is no air to breathe, nothing to carry sound, and nothing to slow down meteoroids or block radiation.',
      },
      {
        heading: 'Extreme temperatures',
        body: 'Without air to spread heat around, temperatures swing hugely. Near the equator the sunlit surface reaches about 120 °C, and nights fall to about −130 °C. Some permanently shadowed craters near the poles are among the coldest places ever measured in the solar system.',
      },
      {
        heading: 'Long days and long nights',
        body: 'The Moon takes about 29.5 Earth days to go from one sunrise to the next, so most places get roughly two weeks of daylight followed by two weeks of darkness.',
      },
      {
        heading: 'One-sixth gravity',
        body: 'Surface gravity is about one-sixth of Earth’s. Walking, lifting and even the way dust settles all behave differently.',
      },
      {
        heading: 'Sharp, clingy dust',
        body: 'Lunar regolith has never been worn smooth by wind or water, so its grains stay jagged. Apollo astronauts found that it stuck to everything and wore down seals, fabrics and visors.',
      },
      {
        heading: 'Ice in the shadows',
        body: 'Craters near the poles that never see sunlight can trap water ice. In 2009 NASA’s LCROSS mission confirmed water in material thrown up from one of these craters. That ice is one reason NASA’s Artemis program is focused on the south polar region.',
      },
    ],
    inGame:
      'Your outpost sits on a polar ridge where sunlight is common but low. The sunlight dial and the dust-damage emergency both come from these conditions.',
    sources: [SRC.moon, SRC.moonBase, SRC.trek],
  },
  {
    id: 'oxygen-systems',
    title: 'Making breathable air',
    summary: 'How splitting water keeps a crew breathing.',
    sections: [
      {
        heading: 'Electrolysis',
        body: 'The International Space Station makes oxygen by electrolysis: running electricity through water to split it into oxygen and hydrogen. Separate equipment scrubs the carbon dioxide that the crew breathes out.',
      },
      {
        heading: 'Closing the loop',
        body: 'The leftover hydrogen does not have to be wasted. A Sabatier reactor combines it with exhaled carbon dioxide to make water, which can be split again, and methane.',
      },
      {
        heading: 'Always a backup',
        body: 'Spacecraft also carry stored oxygen and solid-fuel oxygen generators, often called oxygen candles, which release oxygen through a chemical reaction when the main system fails.',
      },
      {
        heading: 'Oxygen from rocks',
        body: 'Lunar regolith is roughly 40 to 45 percent oxygen by mass, locked inside minerals. Extracting it on site, known as in-situ resource utilization, is an active area of research.',
      },
    ],
    inGame:
      'The habitat’s compact unit only covers part of what the crew breathes. The Oxygen Generator closes the gap but needs steady power. The “oxygen candles” option in the malfunction emergency mirrors a real backup. Production rates in the game are simplified.',
    sources: [SRC.moonBase],
  },
  {
    id: 'water-recycling',
    title: 'Recycling water',
    summary: 'Why astronauts recover almost every drop.',
    sections: [
      {
        heading: 'Every drop counts',
        body: 'Water is heavy and expensive to launch, so long missions recycle almost all of it. Each crew member uses about a gallon (3.8 litres) a day for drinking, preparing food and hygiene.',
      },
      {
        heading: 'How the station does it',
        body: 'The space station’s water recovery system collects humidity from breath and sweat, hygiene water and urine. A urine processor uses vacuum distillation, and a water processor filters and treats everything until it is cleaner than many city water supplies.',
      },
      {
        heading: 'The 98 percent milestone',
        body: 'In 2023, NASA reported that adding a brine processor let the station recover about 98 percent of the water crews bring aboard, up from about 93 to 94 percent.',
      },
      {
        heading: 'Water on the Moon',
        body: 'Ice in permanently shadowed craters could one day supply water, plus oxygen and rocket propellant made from it.',
      },
    ],
    inGame:
      'The habitat recovers half of the water used. Water Recycler levels raise that to 80, 90 and finally 98 percent, matching the station milestone. Recycling needs power, so recovery drops during a brownout.',
    sources: [SRC.issWater, SRC.moonBase],
  },
  {
    id: 'radiation-protection',
    title: 'Radiation protection',
    summary: 'Space weather and the shielding that keeps crews safe.',
    sections: [
      {
        heading: 'Why the Moon is exposed',
        body: 'On Earth, a global magnetic field and a thick atmosphere block most space radiation. The Moon has neither.',
      },
      {
        heading: 'Two kinds of space radiation',
        body: 'Galactic cosmic rays are a constant background of very energetic particles from beyond the solar system. Solar particle events are sudden bursts of protons from the Sun, linked to flares and coronal mass ejections, that can raise exposure sharply for hours or days.',
      },
      {
        heading: 'Forecasting the Sun',
        body: 'Space weather forecasters watch the Sun around the clock. NASA’s DONKI database catalogues solar flares, coronal mass ejections, solar energetic particle events and geomagnetic storms. You can see real recent entries at the top of this Learning Center.',
      },
      {
        heading: 'Shielding',
        body: 'Mass between people and the radiation helps. Water, plastics rich in hydrogen and packed regolith are all candidates. A shelter covered with regolith, or a small interior room surrounded by water and supplies, gives a crew somewhere to wait out a storm.',
      },
    ],
    inGame:
      'LUNARA’s radiation index is a simulated 0–100 game value, not a measured dose, and it is not linked to the real space weather shown here. The Radiation Shelter adds shielding, and your solar storm decisions change how much exposure the crew receives.',
    sources: [SRC.donki, SRC.moonBase],
  },
  {
    id: 'solar-energy',
    title: 'Solar power and storage',
    summary: 'Sunlight near the pole, and surviving the dark.',
    sections: [
      {
        heading: 'Sunlight with no clouds',
        body: 'With no atmosphere, sunlight on the Moon is never filtered or blocked by weather.',
      },
      {
        heading: 'The polar advantage',
        body: 'Near the south pole the Sun stays low on the horizon. Some ridges and crater rims are lit for most of the year, while nearby crater floors stay permanently dark. Light for power next to ice for water is why the region is a priority for Artemis.',
      },
      {
        heading: 'Getting through the dark',
        body: 'Elsewhere, two-week nights mean a base must store energy or make it another way. Options include batteries, regenerative fuel cells and small nuclear fission reactors; NASA’s Fission Surface Power project is developing one for the lunar surface.',
      },
    ],
    inGame:
      'Solar output follows the sunlight dial, which uses a simplified 29.5-day cycle. Battery Storage carries the base through dim stretches, and the power shortage emergency lets you run fuel cells.',
    sources: [SRC.moon, SRC.fsp, SRC.moonBase],
  },
  {
    id: 'growing-food',
    title: 'Growing food in space',
    summary: 'Gardens under LEDs, for food and for morale.',
    sections: [
      {
        heading: 'Gardens in orbit',
        body: 'NASA’s Veggie experiment grows plants aboard the space station under LED lights. In 2015, astronauts ate red romaine lettuce grown in orbit.',
      },
      {
        heading: 'More than calories',
        body: 'Plants take in carbon dioxide and give off oxygen, and astronauts have said that tending green, living things helps on long missions.',
      },
      {
        heading: 'Hard problems',
        body: 'In low gravity, water does not drain the way it does on Earth, so roots can drown or dry out. Lighting, nutrients and disease control all need careful engineering.',
      },
    ],
    inGame:
      'The Hydroponic Greenhouse produces food, adds a little oxygen and lifts morale every day. It needs water and power, and it is one of the first systems to lose power in a crisis.',
    sources: [SRC.veggie],
  },
  {
    id: 'habitat-design',
    title: 'Designing a Moon base',
    summary: 'Pressure, protection and keeping the dust out.',
    sections: [
      {
        heading: 'A pressure vessel first',
        body: 'A habitat must hold breathable air at a comfortable pressure against the vacuum outside, and keep temperatures stable through extreme swings.',
      },
      {
        heading: 'Layers of protection',
        body: 'Micrometeoroids strike at very high speeds. The space station uses layered shields that break up particles before they reach the pressure wall. A lunar base can add a covering of regolith, which also helps with radiation.',
      },
      {
        heading: 'Fighting dust',
        body: 'Airlocks, suit ports and cleaning routines keep abrasive dust out of the living areas.',
      },
      {
        heading: 'Building with local materials',
        body: 'Researchers are testing ways to sinter or 3D-print regolith into bricks and structures so less has to be launched from Earth.',
      },
    ],
    inGame:
      'Each LUNARA building stands in for one of these systems. Micrometeorite and dust emergencies reduce building condition, and repairs cost materials delivered by cargo landers.',
    sources: [SRC.moonBase, SRC.trek],
  },
  {
    id: 'astronaut-survival',
    title: 'Staying healthy on the Moon',
    summary: 'Suits, exercise, isolation and medical care.',
    sections: [
      {
        heading: 'A spacesuit is a spacecraft',
        body: 'A surface suit supplies oxygen, removes carbon dioxide, controls temperature and pressure, and keeps the astronaut in contact with the crew. Axiom Space is developing the suits for NASA’s Artemis landings.',
      },
      {
        heading: 'Bodies in low gravity',
        body: 'Reduced gravity lets bones and muscles weaken. On the space station, crews exercise about two hours a day to limit the loss.',
      },
      {
        heading: 'Isolation and teamwork',
        body: 'Small crews, tight quarters and distance from home affect mood and performance. Regular contact with Earth, meaningful work, routine and private time all help. Radio signals take about 1.3 seconds to travel between Earth and the Moon.',
      },
      {
        heading: 'Medicine far from a hospital',
        body: 'An ill or injured astronaut cannot reach a hospital quickly, so crews train in medical care and carry diagnostic equipment.',
      },
    ],
    inGame:
      'Crew health and morale respond to shortages, radiation, power and your decisions. The Medical Bay heals the crew each day, and losing contact with Earth lowers morale.',
    sources: [SRC.moonBase],
  },
];

export const learningTopic = (id: string) => LEARNING_TOPICS.find((t) => t.id === id);
