import { Disclosure } from "@headlessui/react";
import { MenuIcon, XIcon } from "@heroicons/react/outline";
import produce from "immer";
import { useRecoilState } from "recoil";
import { navState, userState } from "../utils/frontend//store";
import Link from "next/link";
import tw, { styled } from "twin.macro";
import { requestLogin, requestLogout } from "../utils/frontend/near";

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

export default function Example() {
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
                <div className="flex items-center mr-2 -ml-2 md:hidden">
                  {/* Mobile menu button */}
                  <Disclosure.Button className="inline-flex items-center justify-center p-2 text-gray-400 rounded-md hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XIcon className="block w-6 h-6" aria-hidden="true" />
                    ) : (
                      <MenuIcon className="block w-6 h-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <img
                    className="block w-auto h-8 lg:hidden"
                    src="logo.png"
                  />
                  <img
                    className="hidden w-auto h-8 lg:block"
                    src="logo.png"
                  />
                </div>
                <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
                  {NavState.navigation.map((item, index) => (
                    <Link href={buildLink(item)} key={index}>
                      <a
                        onClick={() => handleUpdates(index)}
                        key={index}
                        className={classNames(
                          item.current
                            ? "bg-gray-900 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white",
                          "px-3 py-2 rounded-md text-sm font-medium"
                        )}
                        aria-current={item.current ? "page" : undefined}
                      >
                        {item.name}
                      </a>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="flex items-center">
                {UserState.logged && (<>
                <div className="flex-shrink-0">
                    <Eggs>
                      <img className="w-auto h-6" src="ctt/ctt_logo.png" />
                      <span className="font-sans font-bold text-white text-md">
                        {UserState.tokens}
                      </span>
                    </Eggs>
                  </div> 
                </>)}
                <div className="flex-shrink-0">
                  {!UserState.logged && (
                    <button
                      onClick={requestLogin}
                      type="button"
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                    >
                      <span>Login</span>
                    </button>)}
                  {UserState.logged && (
                    <button
                      onClick={requestLogout}
                      type="button"
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-500 border border-transparent rounded-md shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
                    >
                      <span>Logout</span>
                    </button>
                  )}
                </div>
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
