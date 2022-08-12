import { Disclosure } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import produce from "immer";
import { useRecoilState } from "recoil";
import { navState, userState } from "../utils/frontend//store";
import Link from "next/link";
import tw, { styled } from "twin.macro";
import { requestLogin, requestLogout, claim_aurora, login_aurora } from "../utils/frontend/near";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Eggs = styled.div`
  ${tw`transition w-1/2 mr-2 col-span-1 duration-200 flex flex-row w-auto items-center gap-x-3 bg-theme-darker rounded-md px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-theme-normal focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-purple-500`}
`;

function buildLink(item) {
  if (item.href == "/") {
    return {
      pathname: item.href,
      query: { page: item.page },
    };
  } else {
    return {
      pathname: item.href,
    };
  }
}

export default function Navbar2() {
  const [NavState, setNavState] = useRecoilState(navState);
  const [UserState] = useRecoilState(userState);


  const handleUpdates = (id) => {
    setNavState({
      navigation: produce(NavState.navigation, (draft) => {
        draft.map((a) => (a.current = false));
        draft[id].current = true;
      }),
    });
  };
  return (
    <Disclosure as="nav" className="bg-gray-800">
      {({ open }) => (
        <>
          <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
 

              </div>
              <div className="flex items-center">

                   <button
                    onClick={login_aurora}
                    type="button"
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                  >
                    <span>Lauro</span>
                  </button>
                  <button
                    onClick={claim_aurora}
                    type="button"
                    className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                  >
                    <span>Claim</span>
                  </button>
      
              </div>
            </div>
          </div>

          <Disclosure.Panel className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {NavState.navigation.map((item, index) => (
                <Link href={buildLink(item)} key={index}>
                  <a
                    onClick={() => handleUpdates(index)}
                    key={index}
                    className={classNames(
                      item.current
                        ? "bg-gray-900 text-white"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white",
                      "block px-3 py-2 rounded-md text-base font-medium"
                    )}
                    aria-current={item.current ? "page" : undefined}
                  >
                    {item.name}
                  </a>
                </Link>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
