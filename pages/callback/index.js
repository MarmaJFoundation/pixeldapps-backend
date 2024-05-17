import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Footer from "../../components/Footer";


export default function Home() {
  const [Page, setPage] = useState(undefined);
  const [ErrorCode, setErrorCode] = useState(undefined);
  const router = useRouter();

  useEffect(async () => {
    setErrorCode(router.query.errorCode);
    console.log(router.query.errorCode)
  }, [router.query.errorCode]);

  useEffect(async () => {
    setPage(router.query.page);
    console.log(router.query.page)
  }, [router.query.page]);


  return (
    <div className="font-monst">
      <Head>
        <title>PixelDapps</title>
      </Head>
      <br /><br /><br /><br />


      {((Page == undefined) && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Unknown callback, please contact support</div>
        </>
      )}

      {(Page == "login" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>When you entered your wallet correctly, you should be now able to play pixelpets - have fun playing! :)</div>
        </>
      )}

      {(Page == "pet_bought" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Pet successfully bought, take care of it! :)</div>
        </>
      )}

      {(Page == "pet_bought" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Item successfully bought, take care of it! :)</div>
        </>
      )}

      {(Page == "refill" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Your account is refilled with 100 fighting points and you got an egg - have fun playing! :)</div>
        </>
      )}

      {(Page == "refill_ch" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Your account is refilled with 100 dungeon keys - have fun playing! :)</div>
        </>
      )}

      {(Page == "login_success" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Your login was successful, please click "Authorized" within the game - have fun playing! :)</div>
        </>
      )}

      {(Page == "login_fail" && ErrorCode == undefined) && (
        <>
          <div style={{ color: "white", textAlign: "center", margin: "auto" }}>Login failed - contact discord support</div>
        </>
      )}

      {ErrorCode != undefined && (
        <>

          <div style={{ color: "red", textAlign: "center", margin: "auto" }}> An error occured: {ErrorCode} :(
            <br />Please contact support on Telegram and provide transaction details.
          </div>
        </>
      )}

      <br />
      <div style={{ color: "white", textAlign: "center", margin: "auto" }}>You can close this window</div>
      <br /><br /><br /><br />
      <Footer />
    </div>
  );
}
