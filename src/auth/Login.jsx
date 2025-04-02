import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { BASE_URL } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secretUrl, setSecretUrl] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("login");
  const [qrError, setQrError] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${BASE_URL}/api/register`, {
        email,
        password,
        username,
      });
      console.log("Registration response:", res.data);

      if (res.data && typeof res.data.secretUrl === "string") {
        setSecretUrl(res.data.secretUrl);
        setStep("qr");
        setQrError(false);
      } else {
        console.error("Missing or invalid secretUrl in response:", res.data);
        alert(
          "Registration successful but QR code generation failed. Please contact support."
        );
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert(
        "Registration failed: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("login...");
    try {
        console.log('post...');
        
      const res = await axios.post(`${BASE_URL}/api/login`, {
        username,
        password,
      });
        console.log('res...');

      if (res.data.requiresMFA) {
        console.log('otp...');
        setStep("otp");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(
        "Login failed: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3001/api/verify-otp", {
        username,
        token: otp,
      });
      alert(res.data.success ? "Login successful" : "Login failed");

      if (res.data.success) {
        setStep("login");
        setUsername("");
        setPassword("");
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      alert(
        "OTP verification failed: " +
          (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <>
      {step === "login" && (
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="text-lg font-bold" htmlFor="username">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border-2 p-2 rounded-md"
          />

          <label className="text-lg font-bold" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-2 p-2 rounded-md"
          />

          <label className="text-lg font-bold" htmlFor="password">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 p-2 rounded-md"
          />

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
          >
            Login
          </button>
          <button
            type="button"
            onClick={handleRegister}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md"
          >
            Register
          </button>
        </form>
      )}

      {step === "qr" && (
        <>
          <div className="flex justify-center">
            {qrError ? (
              <div className="w-64 h-64 flex items-center justify-center bg-gray-200 text-red-500">
                QR Code Error
              </div>
            ) : (
              secretUrl && (
                <div className="p-4 bg-white">
                  <QRCodeSVG value={secretUrl} size={256} />
                </div>
              )
            )}
          </div>
          <p className="text-center text-lg font-bold mt-4">
            Scan the QR code with your authenticator app
          </p>
          <button
            type="button"
            onClick={() => setStep("login")}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md mt-4"
          >
            Regresar
          </button>
        </>
      )}

      {step === "otp" && (
        <form onSubmit={verifyOtp} className="flex flex-col gap-4">
          <label className="text-lg font-bold" htmlFor="otp">
            OTP
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border-2 p-2 rounded-md"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
          >
            Verify
          </button>
        </form>
      )}
    </>
  );
}
