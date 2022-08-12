import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PixelPets from "./presale/pixelpets";
import CryptoHero from "./presale/cryptohero";
import CTT from "./presale/ctt";
import Stats from "./tokenomics/Stats";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import { initContract } from "../utils/frontend/near";
import { useRecoilState } from "recoil";
import { userState } from "../utils/frontend/store";
import Pixelparty from "./presale/pixelparty";
import Navbar2 from "../components/Navbar2";

export default function Home() {
  const [Page, setPage] = useState("index");
  const [UserState, setUserState] = useRecoilState(userState);
  const router = useRouter();

  useEffect(async () => {
    setPage(router.query.page);
  }, [router.query.page]);

  useEffect(async () => {
    initContract(setUserState);
  }, []);

  return (
    <div className="font-monst">
      <Head>
        <title>PixelDapps</title>
      </Head>
      <Navbar />
      {Page == "index" && (
        <>
          <PixelPets />

        </>
      )}
      {(Page == "pixelparty") && (
        <>
          <Pixelparty />
        </>
      )}
      {(Page == "pixeltoken") && (
        <>
          <Stats />

        </>
      )}
      {(Page == "pixelpets") && (
        <>
          <PixelPets />

        </>
      )}
      {(Page == "cryptohero") && (
        <>
          <CryptoHero />

        </>
      )}

      {(Page == undefined || Page == "ctt") && (
        <>
          <CTT />

        </>
      )}

      {(Page == "aur") && (
        <>
          <Navbar2 />

        </>
      )}
      <Footer />
    </div>
  );
}
