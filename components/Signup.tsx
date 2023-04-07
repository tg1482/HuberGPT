import { NextPage } from "next";
import { useRouter } from "next/router";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";


const stripePromise = loadStripe("your_stripe_public_key");

const Signup: NextPage = () => {
    const router = useRouter();
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const handleFreeSignup = async () => {
        try {
            const response = await fetch("/api/signup",{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email,password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            // router.push("/signup/free");
        } catch (err) {
            console.error("Error:",err.message);
        }
    };

    const redirectToCheckout = async (priceId: string) => {
        const stripe = await stripePromise;
        if (stripe) {
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId,quantity: 1 }],
                mode: "subscription",
                successUrl: "https://example.com/success",
                cancelUrl: "https://example.com/cancel",
            });

            if (error) {
                console.error("Error:",error);
            }
        }
    };

    return (
        <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-4"> </h1>
            <div className="flex space-x-4">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={handleFreeSignup}
                >
                    5 Free Questions
                </button>
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    onClick={() => redirectToCheckout("price_id_50_queries")}
                >
                    $5 for 50 Questions
                </button>
            </div>
        </div>
    );
};

export default Signup;
