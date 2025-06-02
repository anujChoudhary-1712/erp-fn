/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import React, { ChangeEvent, FormEvent, useState } from "react";
import Button from "../ReusableComponents/Button";
import Input from "../ReusableComponents/InputField";
import AuthApis from "@/actions/Apis/AuthApis";
import { useRouter } from "next/navigation";
import { setCookie } from "@/actions/CookieUtils";
import { useUser } from "@/context/UserContext";

interface FormData {
  email: string;
  password: string;
}

interface Errors {
  [key: string]: string;
}

const LoginForm = ({ userType }: { userType: "internal" | "organization" }) => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const {decodeAndSetUser} = useUser()

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await AuthApis.loginUser({
        email: formData.email,
        password: formData.password,
        userType,
      });
      if (res.status === 200) {
        console.log("Login successful:", res.data);
        setCookie("token", res.data.token, {
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          sameSite: "strict",
          secure: true,
        });
        decodeAndSetUser(res.data.token);
        if (userType === "organization") {
          router.push("/dashboard");
        } else {
          router.push("/internal/organizations");
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    } finally{
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-md min-w-[300px] w-10/12 max-w-[500px]">
        <h2 className="text-xl font-semibold mb-6 text-center">Login</h2>
        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
            error={errors.email}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleInputChange}
            required
            error={errors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={loading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
