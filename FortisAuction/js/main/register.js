import {
    registerUser,
    loginUser,
    createApiKey,
    getProfile,
} from "../api/auth.js";
import { setUser } from "../utils/storage.js";
import { loadHeader, activateHeaderEvents } from "../ui/header.js";


document.addEventListener("DOMContentLoaded", () => {
    loadHeader();
    activateHeaderEvents();

    const form = document.querySelector("#registerForm");
    if (!form) return; // kjør ikke på andre sider

    form.addEventListener("submit", handleRegister);
});

async function handleRegister(e) {
    e.preventDefault();

    const name = document.querySelector("#name")?.value.trim();
    const email = document.querySelector("#email")?.value.trim();
    const password = document.querySelector("#password")?.value.trim();

    if (!name || !email || !password) {
        showToast("Please fill in all fields.", "error");
        return;
    }

    if (!email.endsWith("@stud.noroff.no")) {
        showToast("Email must end with @stud.noroff.no", "error");
        return;
    }

    try {
        // 1) REGISTER
        const reg = await registerUser(name, email, password);
        console.log("REGISTER:", reg);

        if (reg.errors) {
            showToast(reg.errors[0].message, "error");
            return;
        }

        // 2) LOGIN
        const login = await loginUser(email, password);
        console.log("LOGIN:", login);

        if (login.errors) {
            showToast(login.errors[0].message, "error");
            return;
        }

        const { accessToken, name: loginName } = login.data || {};
        if (!accessToken) {
            showToast("Login failed after registration (no accessToken).", "error");
            return;
        }

        const token = accessToken;
        const profileName = loginName || name;

        // 3) API KEY
        const keyRes = await createApiKey(token);
        console.log("API KEY:", keyRes);

        if (keyRes.errors) {
            showToast(keyRes.errors[0].message, "error");
            return;
        }

        const apiKey = keyRes.data?.key;
        if (!apiKey) {
            showToast("Could not create API key.", "error");
            return;
        }

        // 4) PROFILE
        const profile = await getProfile(profileName, token, apiKey);
        console.log("PROFILE:", profile);

        if (profile.errors) {
            showToast(profile.errors[0].message, "error");
            return;
        }

        const userData = profile.data;

        // 5) 1000 startcredits
        const credits = 1000;

        setUser({
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            credits,
            token,
            apiKey,
        });

        // 6) velkomst til index
        sessionStorage.setItem(
            "fa_welcome",
            JSON.stringify({
                name: userData.name,
                isNew: true,
            })
        );

        showToast("Account created! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "/FortisAuction/index.html";
        }, 800);
    } catch (error) {
        console.error(error);
        showToast("Something went wrong during registration.", "error");
    }
}