import { useEffect, useState } from "react";
import Footer from "../../components/Footer";
import axios from 'axios';
import Head from "next/head";

async function getRewards() {
  return await axios.get("api/pixelpets/get-latest-rewards");
}

export default function Home() {
  const [GobalData, setGlobal] = useState([]);
  const [ClashData, setClash] = useState([]);

  useEffect(async () => {
    const data = (await getRewards()).data.data;

    const global = data.filter(x => x.type == 1).sort(x => x.reason);
    const clash = data.filter(x => x.type == 0).sort(x => x.reason);

    setGlobal(global);
    setClash(clash);

  }, []);


  return (
    <div className="mx-auto mt-24 sm:px-6 lg:px-0 max-w-7xl">
      <Head>
        <title>Pixelpets Rewards</title>
      </Head>
      <div className="font-monst">
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
            <div className="row">
              <div className="column" style={{ borderRight: "1px solid #FFF" }}>
                <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                  <span className="block text-white">Clash Rewards</span>
                </h1>
                <div className="mt-6 max-w-lg mx-auto text-left pl-8 pr-8 text-md text-indigo-200 sm:max-w-3xl">

                  {ClashData.map((data, index) => (
                    <div key={index}> <b>{data.reason}</b>
                      <br />  <br />
                      {data.rewards.map((data2, index2) => (
                        <div key={index2}> #{index2 + 1} {data2.receiver_id} - {data2.pixeltoken / 1000000}</div>

                      )
                      )}
                      <br />
                      <hr />
                      <br />
                    </div>

                  )
                  )}

                </div>
              </div>
              <div className="column">
                <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                  <span className="block text-white">Global Rewards</span>
                </h1>
                <div className="mt-6 max-w-lg mx-auto text-left pl-8 text-md text-indigo-200 sm:max-w-3xl">

                  {GobalData.map((data, index) => (
                    <div key={index}> <b>{data.reason}</b>
                      <br />  <br />
                      {data.rewards.map((data2, index2) => (
                        <div key={index2}> #{index2 + 1} {data2.receiver_id} - {data2.pixeltoken / 1000000}</div>

                      )
                      )}
                      <br />
                      <hr />
                      <br />
                    </div>

                  )
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <br />
      <Footer />
    </div>
  );
}
