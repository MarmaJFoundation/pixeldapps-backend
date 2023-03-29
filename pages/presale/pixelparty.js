
const faqs = [
  {
    question: "Preface: Still in progress",
    answer:
      "The concepts are still in progress and not finalized yet, but the following content gives some insight about the current plans.",
  },
  {
    question: "When will PixelPets launch?",
    answer: "If everything goes smooth, launch will be in September.",
  },
  {
    question: "How many pets will PixelPets have?",
    answer: "The initial launch will have 60 different pets.",
  },
  {
    question: "What are the stats of a pet?",
    answer: "Rarity, Quality, Level, Attack, Health, Speed, Magic",
  },
  {
    question: "Rarity?",
    answer:
      "Each creature can have one of 4 rarity-types: common, rare, epic or legendary. Based on that the attack, health, speed and magic stats of the creatures are increased.",
  },
  {
    question: "Can my pet evolve?",
    answer:
      "Yes some pets are able to evolve to a next stage, more info about that soon.",
  },
  {
    question: "How does fighting work?",
    answer:
      "You set a lineup of 3 creatures and fight against another lineup of 3 creatures in a turn based autobattler fight. Defeated creatures need a rest for 8 hours.",
  },
  {
    question: "League System?",
    answer:
      "Based on your success in fights you earn or lose ranking points. Depending on that your a assigned to a certain league and fight versus other players within the same league.",
  },
  {
    question: "Tournaments?",
    answer:
      "Occasionally there are tournaments where you can win a lot of pixeltoken and epic/legendary eggs.",
  },
  {
    question: "Level System?",
    answer:
      "Your pet gets experience in each fight and will level up after it has gained enough xp.",
  },
  {
    question: "How many pets can I own per account/wallet?",
    answer: "Each account/wallet has a limit of 40 pets.",
  },
  {
    question: "More questions?",
    answer: "Join Discord and ask!",
  },

  // More questions...
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Pixelparty() {
  return (
    <div className="mx-auto mt-8 mb-6 sm:px-6 lg:px-0 max-w-7xl">
      <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="/shiney.svg"
            alt="People working on laptops"
          />
          <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
        </div>
        <div className="relative px-4 pt-8 sm:px-6 sm:pt-20 lg:pt-10 lg:px-6">
          <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            <span className="block text-white">What is Pixelparty?</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-center text-lg text-gray-200 sm:max-w-3xl">
            PixelParty is an NFT Frame showcase built on the NEAR Protocol with
            a total supply of 600 tokens. Each token you own, allows you to draw
            on a 20x20px frame. <br />
            You could buy several connected frames to draw a larger frame.
            Additionally all frameholders will receive small rewards within the pixeltoken
            ecosystem from time to time.
          </p>
        </div>
        <div className="relative px-4 py-8 sm:px-6 flex items-center flex-col sm:py-20 lg:py-10 lg:px-6">
          <div className="grid grid-cols-2 md:space-x-2 space-y-4 md:space-y-0">
            <img style={{ height: "400px" }}
              className="rounded-xl shadow-xl col-span-2 md:col-span-1 mx-auto"
              src="pixelparty2.jpg"
            />
            <img style={{ height: "400px" }}
              className="rounded-xl shadow-xl col-span-2 md:col-span-1 mx-auto"
              src="pixelparty1.jpg"
            />
          </div>
          <a
            href="https://pixelparty.marmaj.org/"
            className="px-8 py-2 mx-auto mt-10 text-base font-medium text-white bg-gray-700 border border-transparent rounded-md shadow w-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
          >
            Visit Pixelparty
          </a>
        </div>
      </div>
    </div>
  );
}
