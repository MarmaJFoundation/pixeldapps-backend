import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon, ClipboardListIcon } from "@heroicons/react/outline";
import { useState, useEffect } from "react";
import { account_id, buy_item, getSupplyData, is_whitelisted, requestLogin } from "../../utils/frontend/near";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const tiers = [
  {
    name: "Whitelist Minting",
    img: "ctt/mint1.png",
    price: 1,
    includedFeatures: ["1 NEAR", "500 max supply"],
    type: "wl"
  },
  {
    name: "Discounted Minting",
    img: "ctt/mint2.png",
    price: 1.5,
    includedFeatures: ["1.5 NEAR", "1000 max supply"],
    type: "ps"
  },
  {
    name: "Regular Minting",
    img: "ctt/mint3.png",
    price: 2,
    includedFeatures: ["2 NEAR", "5200 max supply"],
    type: "mint"
  }
];

export default function CTT() {

  function supplyCheck(supply_used, type) {
    let max_supply = 0;
    if (type == "wl") {
      max_supply = 500;
    }
    else if (type == "ps") {
      max_supply = 1000;
    }
    else if (type == "mint") {
      max_supply = 5200;
    }
    //console.log(max_supply);

    const supply = Math.abs(supply_used - max_supply);

    if (supply > 20000) {
      return "checking...";
    }
    if (supply == 0) {
      return "Soldout!";
    }

    return supply;
  }

  function buy_login(type, price) {
    if (account_id != "") {
      buy_item(type, price);
    }
    else {
      requestLogin();
    }
  }

  const [Supply, setSupply] = useState({
    wl: -100000,
    ps: -100000,
    mint: -100000
  });

  const [Whitelisted, setWL] = useState(false);

  useEffect(async () => {
    setTimeout(async () => {
      const wl = await is_whitelisted();
      setWL(wl);
      const supply = await getSupplyData();
      setSupply(supply);
    }, 3000);
  }, []);


  return (
    <div className="bg-gray-800">
      <div className="px-4 py-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div className="px-4 mt-10 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-gray-200 sm:text-4xl">
              Chain Team Tactics
            </h2>
            <p className="mt-3 text-xl text-gray-300 sm:mt-4">
              Chain Team Tactics is an nft based pvp battle simulator.
              <br />
              <br />Collect a minimum of 6 units and start to battle other players!
              <br />Each battle is fought as best of three and the starting player changes each round.
              <br />To make it more spicy, you will battle about your PXT stake (after beta).

              <br />

              <br /><br /> Chain Team Tactics beta launched <b>30.05.2022</b> on mainnet. Beta will last for about 6-8 weeks.
              It can be expected that major changes and some bugfixes will take place during the beta.

              <br /><br /> After the beta ends, rewards will be distributed to the top 50 players on the leaderboard. There will be no rewards during the beta,
              therefor we will distribute some NFTs to top 10 leaderboard when beta ends: 5x CTT Unit-Token, 3x NEAR Meerkats, 2x Misfits, 1x Tiger Academy.

              <br /><br /> If you want to know more, look at the FAQ-Section at the bottom and also join our Telegram!
            </p>
          </div>
        </div>
      

        <div className="bg-gray-800">

          <div className="mx-auto mt-8 mb-6 sm:px-6 lg:px-0 max-w-7xl">
            <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
              <div className="absolute inset-0">
                <img
                  className="h-full w-full object-cover"
                  src="/shiney.svg"
                />
                <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
              </div>
              <div className="relative px-4 pt-8 pb-8 sm:px-6 lg:px-6">
                <p className="mt-2 max-w-lg mx-auto text-center text-lg text-gray-200 sm:max-w-3xl">
                  <a
                    href="https://pd.marmaj.org/chainteam"
                    className="px-8 py-2 mx-auto text-base font-medium text-white bg-gray-700 border border-transparent rounded-md shadow w-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                  >
                    Play Chain Team Tactics Beta
                  </a>

                </p>

              </div>
            </div>
          </div>

        </div>


        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="bg-gray-200 border border-gray-200 divide-y divide-gray-200 rounded-lg shadow-sm"
            >
              <div className="p-6 pb-2">
                <h2 className="text-2xl font-bold leading-6 text-gray-800">
                  {tier.name}
                </h2>
                <p className="mt-4">
                  <img
                    src={tier.img}
                    className="object-cover -mb-2"
                    alt="Alt goes here!"
                  />
                </p>
              </div>
              <div className="px-6" style={{ marginBottom: "12px" }}>
                <ul className="mt-2 space-y-2">
                  {tier.includedFeatures.map((feature) => (
                    <li key={feature} className="flex space-x-1">
                      <ClipboardListIcon
                        className="flex-shrink-0 w-5 h-5 text-green-700"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
                <ul className="mt-2 space-y-2">
                  <li key="supply" className="flex space-x-3">
                    <span className="text-sm text-gray-500"><b>Available:</b> {supplyCheck(Supply[tier.type.toLowerCase()], tier.type.toLowerCase())}</span>
                  </li>
                </ul>
              </div>
              {supplyCheck(Supply[tier.type.toLowerCase()], tier.type.toLowerCase()) > 0 && (Whitelisted || tier.type != "wl") && (
                <a
                  onClick={() => { buy_login(tier.type, tier.price) }}
                  href="#"
                  className="block w-full py-2 text-sm font-semibold text-center text-white bg-indigo-800 border border-gray-800 rounded-md hover:bg-indigo-400"
                >
                  {tier.price} Ⓝ
                </a>
              )}

            </div>
          ))}
        </div>

      </div>

      <div className="mx-auto mt-8 mb-6 sm:px-6 lg:px-0 max-w-7xl">
        <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
          <div className="absolute inset-0">
            <img
              className="h-full w-full object-cover"
              src="/shiney.svg"
            />
            <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
          </div>

          <div className="relative px-4 py-8 sm:px-6 flex items-center flex-col sm:py-20 lg:py-10 lg:px-6">
            <div className="grid grid-cols-1 md:space-x-2 space-y-4 md:space-y-0">

              <center><img src="ctt/ctt_rarity_table.png"></img></center>
              <br />
              <br></br>

            </div>

          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto divide-y-2 divide-gray-700">
            <h2 className="text-center text-3xl font-extrabold text-gray-200 sm:text-4xl">
              Chain Team Tactics Q & A
            </h2>
            <dl className="mt-6 space-y-6 divide-y divide-gray-700">
              {faqs.map((faq) => (
                <Disclosure defaultOpen={true} as="div" key={faq.question} className="pt-6">
                  {({ open }) => (
                    <>    <br />
                      <dt className="text-lg">
                        <Disclosure.Button className="text-left w-full flex justify-between items-start text-gray-400">
                          <span className="font-medium text-gray-200">
                            {faq.question}
                          </span>
                          <span className="ml-6 h-7 flex items-center">
                            <ChevronDownIcon
                              className={classNames(
                                open ? "-rotate-180" : "rotate-0",
                                "h-6 w-6 transform"
                              )}
                              aria-hidden="true"
                            />
                          </span>
                        </Disclosure.Button>
                      </dt>
                      <Disclosure.Panel as="dd" className="mt-2 pr-12">
                        <p className="text-base text-gray-400">{faq.answer}</p>
                        <br />
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

const faqs = [
  {
    question: "How to get whitelisted?",
    answer:
      "Pixelparty frame holder can ask for a wl spot on CTT channel on Telegram.",
  },
  {
    question: "How many units are needed to play?",
    answer:
      "6 units are required to play a match and a wallet can hold up to 20 tokens. We will increase that limit to 30 at a later point. You can't use more than 3 support units per fight.",
  },
  {
    question: "Will the max supply of tokens ever change?",
    answer:
      "We plan to release a new unit-class every few months, every new unit-class release will extend the max supply by 100-250.",
  },
  {
    question: "How does the battlesystem work?",
    answer:
      "Each match is a asynchronous best of three. A player places units and the other player reacts to it. If a player doesn't react within 24 hours the game is lost.",
  },
  {
    question: "Is trading on Paras supported?",
    answer:
      "Not yet, the game will start with an in-game marketplace. The team is working on compatibility with paras, but not done yet.",
  },
  {
    question: "Is there a difference between tokens of the same unit-class?",
    answer:
      "Yes - each unit has a powerlevel between 90 and 110, changing their stats slightly. You see the powerlevel of your unit on the web wallet and within the game.",
  }
];

