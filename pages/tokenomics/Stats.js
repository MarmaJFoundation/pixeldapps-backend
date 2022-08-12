import { invalid_ft_transfer } from "../../utils/frontend/near";
import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/outline";
import { useRecoilState } from "recoil";
import { userState } from "../../utils/frontend/store";
import { NotificationContainer } from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto'

const Stats = () => {
  const [userStateVar] = useRecoilState(userState);

  const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  };


  const chartdata = {
    labels: ["01/22", "02/22", "03/22", "04/22", "05/22"],
    datasets: [
      {
        label: "PXT rewards",
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        data: [20000, 1000, 20000, 20000, 20000],
        lineTension: 0.5,  
        //fill: 1
      },
      {
        label: "PXT Buyback",
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        data: [500, 3000, 500, 4000],
        lineTension: 0.5,  
        fill: {above: 'rgba(54, 162, 235, 0.2)', below: 'rgba(255, 99, 132, 0.2)', target: '-1'}
      },
    ],
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  function addPxtToWallet() {
    invalid_ft_transfer();
  };

  return (
    <div className="pt bg-gray-800">
      <NotificationContainer />


      <div className="mx-auto mt-24 sm:px-6 lg:px-0 max-w-7xl mb-8">
        <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
          <div className="absolute inset-0">
            <img
              className="h-full w-full object-cover"
              src="/shiney.svg"
              alt="People working on laptops"
            />
            <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
          </div>
          <div className="relative px-4 py-8 sm:px-6 sm:py-20 lg:py-10 lg:px-6">
            <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              <span className="block text-white">Pixeltoken</span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-center text-xl text-indigo-200 sm:max-w-3xl">
              Pixeltoken is the utility token used for Pixelpets, Cryptoheroes and Chain Team Tactics - with a total supply of 12.500.000 tokens.
              The game economy and actions are completly built upon the token and are used for all ingame actions and marketplaces.
              <br /><br />
              <a
                href="https://app.ref.finance/#wrap.near%7Cpixeltoken.near"
                target={"_blank"}
                className="px-8 py-2 mx-auto mt-10 text-base font-medium text-white bg-gray-700 border border-transparent rounded-md shadow w-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
              >
                Get Pixeltoken on Ref-Finance
              </a>
              <br /><br />

              {(userStateVar.logged && userStateVar.pixeltoken > 0) && (
                <>

                  <button
                    onClick={() => addPxtToWallet()}
                    className="px-8 py-2 mx-auto mt-2 text-base font-medium text-white bg-gray-700 border border-transparent rounded-md shadow w-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600"
                  >
                    Add PXT to NEAR Webwallet
                  </button>

                </>
              )}


            </p>

          </div>
        </div>
      </div>


      {/* <div style={{ backgroundColor: "white", width: "500px"}}>
        <Line
          datasetIdKey='id'
          data={chartdata}
        />

      </div> */}



      <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden max-w-7xl mx-auto mt-8 mb-8">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover"
            src="/shiney.svg"
          />
          <div className="absolute inset-0 bg-indigo-700 mix-blend-multiply" />
        </div>
        <div className="relative px-4 pt-8 sm:px-6 sm:pt-20 lg:pt-10 lg:px-6">
          <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
            <span className="block text-white">Initial tokendistribution</span>
          </h1>
        </div>
        <div className="relative px-4 py-8 sm:px-6 flex items-center flex-col sm:py-20 lg:py-10 lg:px-6 w-auto">
          <div className="grid grid-cols-1 md:space-x-2 space-y-4 md:space-y-0 w-full">
            <center>
              <table className="text-white" style={{ width: "600px", textAlign: "center", marginLeft: "-100px" }}>
                <thead>
                  <tr>
                    <td>
                      <b>Usage</b>
                    </td>
                    <td>
                      <b>Tokens</b>
                    </td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      Tokenswap & Skyward IDO
                    </td>
                    <td>
                      4.000.000
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Ingame Rewards
                    </td>
                    <td>
                      3.250.000
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Games Presale Allocation
                    </td>
                    <td>
                      2.000.000
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Marketing
                    </td>
                    <td>
                      1.250.000
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Ref Pool
                    </td>
                    <td>
                      750.000
                    </td>
                  </tr>
                  <tr>
                    <td>
                      DAO
                    </td>
                    <td>
                      750.000
                    </td>
                  </tr>
                  <tr>
                    <td>
                      Dev Team
                    </td>
                    <td>
                      500.000
                    </td>
                  </tr>
                </tbody>
              </table>
            </center>

          </div>

        </div>
      </div>


      <div className="mt-12">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto divide-y-2 divide-gray-700">
            <h2 className="text-center text-3xl font-extrabold text-gray-200 sm:text-4xl">
              Pixeltoken Q & A
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

    </div >
  );
};

export default Stats;

const faqs = [
  {
    question: "How are the ingame rewards distributed?",
    answer:
      "Pixelpets and Cryptoheroes distribute Pixeltoken each week through their leaderboards. More details into the game itself or their wiki.",
  },
  {
    question: "Who will manage the marketing funds?",
    answer:
      "All funds are managed by the Pixeltoken AstroDAO.",
  }
];


