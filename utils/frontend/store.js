import { atom, useRecoilState } from "recoil";

export const navState = atom({
    key: "navState", // unique ID (with respect to other atoms/selectors)
    default: {
        navigation: [
            { name: "Pixelparty", href: "/", current: false, page: "pixelparty" },
            { name: "Pixelpets", href: "/", current: false, page: "pixelpets" },
            { name: "Cryptoheroes", href: "/", current: false, page: "cryptohero" },
            { name: "Chain Team Tactics", href: "/", current: true, page: "ctt" },
            { name: "Pixeltoken", href: "/", current: false, page: "pixeltoken" },
        ],
    }, // default value (aka initial value)
});

export const userState = atom({
    key: "userState", // unique ID (with respect to other atoms/selectors)
    default: {
        logged: false,
        ctt_tokens: 0,
        pixeltoken: 0
    }, // default value (aka initial value)
});
