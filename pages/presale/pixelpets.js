
const cards = [
  {
    title: "Hatch",
    imageUrl: "hatch.png",
    text: "Collect eggs and hatch them. It takes a while to hatch an egg and you can only hatch one egg at a time. Based on egg-rarity it takes longer to hatch the egg but also raises the chance to get a stronger version of it.",
  },
  {
    title: "Train",
    imageUrl: "train.png",
    text: "You want to raise the quality-rank of your creature? Send it to the gym and after some time you pet returns much more in shape.",
  },
  {
    title: "Evolve",
    imageUrl: "evolve.png",
    text: "After your Pet has enough experience and the required quality level, take your pet to the next step and evolve it in the evolution-chamber.",
  },
  {
    title: "Fight",
    imageUrl: "fight.png",
    text: "Battle other Petmasters, just for fun to farm experience, duel with other competitors to raise your reputation to the master-league or enter the colosseum and fight in the arena for prizes and honor.",
  },
  // More people...
];

const faqs = [
  {
    question: "Preface: Still in progress",
    answer:
      "The concepts are still in progress and not finalized yet, but the following content gives some insight about the current plans.",
  },
  {
    question: "When will PixelPets launch?",
    answer:
      "If everything goes smooth, launch will be in September.",
  },
  {
    question: "How many pets will PixelPets have?",
    answer:
      "The initial launch will have 60 different pets.",
  },
  {
    question: "What are the stats of a pet?",
    answer:
      "Rarity, Quality, Level, Attack, Health, Speed, Magic",
  },
  {
    question: "Rarity? Quality?",
    answer:
      "Each creature can have one of 4 rarity-types: common, rare, epic or legendary. Based on that the attack, health, speed and magic stats of the creatures are increased. Quality works in a similiar way, but unlike the rarity it's possible to raise the quality of a pet by training, till a certain limit.",
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
    answer:
      "Each account/wallet has a limit of 30 pets.",
  },
  {
    question: "More questions?",
    answer:
      "Join our Telegram and ask!",
  },

  // More questions...
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Eggs() {
  return (
    <div className="mx-auto mt-24 sm:px-6 lg:px-0 max-w-7xl">
      <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="/shiney.svg"
          />
          <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
        </div>
        <div className="relative px-4 py-8 sm:px-6 sm:py-20 lg:py-10 lg:px-6">
          <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            <span className="block text-white">What is PixelPets?</span>
          </h1>
          <p className="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
            PixelPets is an NFT game for pet trading and battling. Each token
            represents one of a total of 60 different pet types. Each pet has a certain rarity type (common, rare, epic or legendary) which affects their strength beneath other stats like quality and level.

            <br /> <br />
            It combines collect to earn/compete to earn concept via the built-in pet marketplace and by a few days lasting tournaments with a prizepool for the best players running each week.
            <br />  <br />

            <a
              href="https://pd.marmaj.org/pixelpets"
              className="px-8 py-2 mx-auto mt-10 text-base font-medium text-white bg-gray-700 border border-transparent rounded-md shadow w-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
            >
              Play Pixelpets!
            </a>
          </p>

        </div>
      </div>

      <ul className="space-y-12 mt-20 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-x-6 sm:gap-y-12 sm:space-y-0 lg:gap-x-8">
        {cards.map((card, index) => (
          <li key={index}>
            <div className="space-y-8">
              <div className="aspect-w-2 aspect-h-2">
                <img
                  className="object-cover rounded-lg shadow-lg"
                  src={card.imageUrl}
                  alt=""
                />
              </div>
              <div>
                <div className=" font-medium leading-6">
                  <p className="text-gray-100 text-2xl">{card.title}</p>
                </div>
                <div className="text-lg mt-2">
                  <p className="text-gray-400 text-justify">{card.text}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-24 mx-auto max-w-7xl px-4 sm:mt-24 sm:px-6 lg:mt-24 mb-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-5 lg:flex lg:items-center">

            <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md" style={{ width: "300px", height: "300px" }}>

              <img className="w-full" src="/presale.jpg" alt="" />

            </div>
          </div>
          <div className="sm:text-center mt-10 md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
            <h1>
              <span className="block text-sm font-semibold uppercase tracking-wide sm:text-base lg:text-sm xl:text-base text-gray-100 text-2xl">
                Marketplace
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-400 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
              Pixelpets will have a marketplace where you can sell your pets or buy pets from others via pixeltoken.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}
