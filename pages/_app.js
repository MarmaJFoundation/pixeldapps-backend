import "../styles/globals.css";
import { RecoilRoot } from "recoil";
import dynamic from "next/dynamic";
import { GlobalStyles } from "twin.macro";

function MyApp({ Component, pageProps }) {

  return (
    <RecoilRoot>
      <GlobalStyles />
      <Component {...pageProps} />
    </RecoilRoot>
  );
}

export default dynamic(() => Promise.resolve(MyApp), {
  ssr: false,
});
//export default MyApp;
