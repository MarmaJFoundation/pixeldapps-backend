/* This example requires Tailwind CSS v2.0+ */
import { CheckIcon } from "@heroicons/react/solid";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import { useEffect, useState } from "react";
import { account_id, buy_item, getSupplyData, requestLogin } from "../../utils/frontend/near";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function CH_Presale() {


  return (
    <div className="bg-gray-800">

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
              <span className="block text-white">What is Cryptoheroes?</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-center text-lg text-gray-200 sm:max-w-3xl">
              <a
                href="https://pd.marmaj.org/cryptoheroes"
                className="px-8 py-2 mx-auto mt-10 text-base font-medium text-white bg-gray-700 border border-transparent rounded-md shadow w-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              >
                Play Cryptoheroes!
              </a>
              <br /><br />

              Cryptoheroes is a blockchain based game, focused on PvE looting, trading and forging items as well as fighting bosses with friends to earn PXT. <br /> <br />
              Enter dangerous dungeon on your own, defeat evil minions and gather loot to improve your strength! <br /> <br />
              Join raids with allies to defeat more evil bosses in epic fights and compete about weekly PXT rewards!  <br />
              Each raid consists of 8 players and the top 20 raids are rewarded each week. You can also place your items on the marketplace or reforge them to improve your existing gear.
            </p>
            <br />
            <p className="mt-6 max-w-lg mx-auto text-center text-lg text-gray-200 sm:max-w-3xl">

              <b>How to earn?</b><br />

              Collect to earn (Dungeons & Marketplace): <br />
              Defeat enemies in dungeons, collect powerful items and sell them on the marketplace.
              <br /><br />
              Compete to earn (Raids):<br />
              Team up with 7 other players and join the weekly raid together to compete with other teams. The top 20 raid teams are rewarded with PXT.

            </p>
          </div>
          <br /><br />
        </div>
      </div>

      {/* <div className="mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto divide-y-2 divide-gray-700">
            <h2 className="text-center text-3xl font-extrabold text-gray-200 sm:text-4xl">
              Cryptoheroes Q & A
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
      </div> */}
    </div>
  );
}

const faqs = [
  {
    question: "What type of heroes are available?",
    answer:
      "Each player has 3 heroes to manage: A knight, mage and assassin.",
  },
  {
    question: "Can an item be equipped to any hero?",
    answer:
      "Items are usually bound to a class.",
  },
  {
    question: "How many items can a hero wear?",
    answer:
      "Six items per hero: Weapon, hat, necklace, ring, armor and shoes. The global inventory can contain up to 60 items.",
  },
  {
    question: "Do heroes have any stats or just item stats?",
    answer:
      "The hero has some basic stats, but hero stats are mainly provided by weared items.",
  },
  {
    question: "Will there be regular lootboxes in the final game?",
    answer:
      "We have not decided to add lootboxes in game yet. However, if that changes it's likely they only contain 2-3 items to choose from and not 10. Loot is usally collected by defeating dungeons.",
  },
  {
    question: "What is the rarity of titan items?",
    answer:
      "It gives a random item that ranges from rare to epic and legendary.",
  }
];

