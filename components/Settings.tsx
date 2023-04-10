import React,{ useState } from "react";
import { signIn,signOut,getSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import { createSubscription } from "@/lib/subscription";

interface GroupButtonProps {
    title: string;
    group: string;
    content: JSX.Element;
}

interface SubGroupButtonProps {
    title: string;
    style?: string | null;
    onClick: () => void;
}

interface SettingsProps {
    showSettings: boolean;
    setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
    queryCount: number;
    setQueryCount: React.Dispatch<React.SetStateAction<number>>;
    freeQueries: number;
    setFreeQueries: React.Dispatch<React.SetStateAction<number>>;
    openAPILimit: boolean;
    setOpenAPILimit: React.Dispatch<React.SetStateAction<boolean>>;
    apiKey: string;
    setApiKey: React.Dispatch<React.SetStateAction<string>>;
    email: string;
    setEmail: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    userId: number;
    setUserId: React.Dispatch<React.SetStateAction<number>>;
    userEmail: string | null;
    setUserEmail: React.Dispatch<React.SetStateAction<string | null>>;
    userSignedIn: boolean;
    setUserSignedIn: React.Dispatch<React.SetStateAction<boolean>>;
    userAgeGroup: string;
    setUserAgeGroup: React.Dispatch<React.SetStateAction<string>>;
    userSex: string;
    setUserSex: React.Dispatch<React.SetStateAction<string>>;
    userFitnessLevel: string;
    setUserFitnessLevel: React.Dispatch<React.SetStateAction<string>>;
    userAnythingElse: string;
    setUserAnythingElse: React.Dispatch<React.SetStateAction<string>>;
    userSearchParameters: string;
    setUserSearchParameters: React.Dispatch<React.SetStateAction<string>>;
}


export const Settings: React.FC<SettingsProps> = ({
    showSettings,
    setShowSettings,
    queryCount,
    setQueryCount,
    freeQueries,
    setFreeQueries,
    openAPILimit,
    setOpenAPILimit,
    apiKey,
    setApiKey,
    email,
    setEmail,
    password,
    setPassword,
    userId,
    setUserId,
    userEmail,
    setUserEmail,
    userSignedIn,
    setUserSignedIn,
    userAgeGroup,
    setUserAgeGroup,
    userSex,
    setUserSex,
    userFitnessLevel,
    setUserFitnessLevel,
    userAnythingElse,
    setUserAnythingElse,
    userSearchParameters,
    setUserSearchParameters,
}) => {
    const [error,setError] = useState<string | null>(null);
    const [activeGroup,setActiveGroup] = useState<string | null>(null);
    const [activeSubGroup,setActiveSubGroup] = useState<string | null>(null);

    const setSessionState = async (user: any) => {
        console.log("Setting stage",user)
        if (user) {
            if (user.id !== -99) {
                const response = await fetch(`/api/get-query-counts?userId=${user.id}`);
                if (response.ok) {
                    const { queriesMade,queriesAllowed } = await response.json();
                    setFreeQueries(queriesAllowed);
                    setQueryCount(queriesMade);
                }
            } else {
                setFreeQueries(user.queriesAllowed);
                setQueryCount(user.queriesMade);
            }
            setUserId(user.id);
            if (user.id !== -99) {
                setUserSignedIn(true);
                setUserEmail(user.email);
            };
        }
    };

    const handleGroupButtonClick = (group: string) => {
        if (activeGroup === group) {
            setActiveGroup(null);
        } else {
            setActiveGroup(group);
        }
    };

    const getGroupColor = (group: string) => {
        switch (group) {
            case "authentication":
                return "bg-green-600 text-white";
            case "userProfile":
                return "bg-blue-600 text-white";
            case "searchParameters":
                return "bg-red-600 text-white";
            default:
                return "text-black";
        }
    };

    const handleSubGroupButtonClick = (subGroup: string) => {
        if (activeSubGroup === subGroup) {
            setActiveSubGroup(null);
        } else {
            setActiveSubGroup(subGroup);
        }
    };

    const renderGroupButton = ({ title,group,content }: GroupButtonProps) => (
        <div>
            <button
                className={`mt-4 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50 ${activeGroup === group ? "bg-zinc-600 text-white" : getGroupColor(group)}`}
                onClick={() =>
                    handleGroupButtonClick(group)
                }
            >
                {title}
            </button>
            {activeGroup === group && content}
        </div >
    );

    const SubGroupButton: React.FC<SubGroupButtonProps> = ({ title,style = null,onClick }) => (
        <button
            className={`mt-2 flex cursor-pointer items-center space-x-2 rounded-full px-3 py-1 text-sm text-white hover:opacity-50 ${style ? style : "bg-blue-400"}`}
            onClick={onClick}
        >
            {title}
        </button>
    );

    const renderSubGroupContent = (subGroup: string,content: JSX.Element) => {
        if ((activeSubGroup === subGroup)) {
            return content;
        }
        return null;
    };

    const renderInputField = (type: string,placeholder: string,onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
        <input
            type={type}
            placeholder={userAnythingElse ? userAnythingElse : placeholder}
            className="mt-2 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
            onChange={onChange}
        />
    );


    const handleSignIn = async () => {
        setError(null);

        const result = await signIn("credentials",{
            redirect: false,
            email,
            password,
        });

        if (result?.error) {
            setError(result.error);
        } else {
            const session = await getSession();
            if (session) {
                // The user is now signed in; handle the signed-in state here.
                console.log("User is signed in:",session.user);
                setSessionState(session.user);
                setUserSignedIn(true);
                setShowSettings(false);
            } else {
                // The sign-in attempt failed; handle the error here.
                setError("Something going on");
            }
        }
    };

    const handleSignOut = async () => {
        await signOut();
    };


    const signUp = async (email: string,password: string) => {

        function isValidEmail(email: string): boolean {
            // Define the regex pattern for an email address
            const emailRegex = new RegExp(/^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/);

            // Check if the input email matches the regex pattern
            return emailRegex.test(email);
        }

        try {
            // check email and password are valid
            if ((email === '' || password === '') && !isValidEmail(email)) {
                throw new Error('Please enter a valid email and password.');
            }

            const response = await fetch('/api/signup',{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email,password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            console.log('User created successfully!');

            const responseBody = await response.json();
            const userId = parseInt(responseBody.userId);

            return userId;
        } catch (err: any) {
            console.error('Error:',err.message);
            throw new Error(err.message);
        }
    };

    const handleFreeSignUp = async () => {
        try {
            const userId = await signUp(email,password);

            await createSubscription(1,userId);

            console.log('Subscription created successfully!');

            // sign in
            await handleSignIn();
        } catch (err: any) {
            console.error('Error:',err.message);
            alert(err.message);
        }
    };


    const handlePaidSignUp = async () => {
        try {
            const userId = await signUp(email,password);
            const priceId = "price_1MumJgCXd0dypVQUqqNOBOr0"; // replace with the actual price ID
            await handleSignIn();
            await collectPayment(priceId,userId);
        } catch (err: any) {
            console.error('Error:',err.message);
            alert(err.message);
        }
    };

    const collectPayment = async (priceId: string,userId: number) => {
        const stripe_key = process.env.NEXT_PUBLIC_STRIPE_KEY as string;
        const stripePromise = loadStripe(stripe_key);
        const stripe = await stripePromise;
        if (stripe) {
            const { error } = await stripe.redirectToCheckout({
                lineItems: [{ price: priceId,quantity: 1 }],
                mode: "payment",
                // redirect back to the site after payment
                successUrl: `${window.location.origin}/api/payment-success?userId=${userId}`,
                cancelUrl: `${window.location.origin}/`,
            });
            if (error) {
                console.error("Error:",error);
                throw new Error(error.message);
            }
        }
    };

    const handleApiKeySubmit = async () => {
        if (!apiKey || apiKey.length != 51) {
            alert("Please enter a valid API key");
            return;
        }
    };

    const handleAgeGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUserAgeGroup(e.target.value);
        localStorage.setItem("HGPT_USER_AGE",e.target.value);
    };

    const handleSexChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUserSex(e.target.value);
        localStorage.setItem("HGPT_USER_SEX",e.target.value);
    };

    const handleFitnessLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setUserFitnessLevel(e.target.value);
        localStorage.setItem("HGPT_USER_FITNESS_LEVEL",e.target.value);
    };

    const handleAnythingElseInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserAnythingElse(e.target.value);
        localStorage.setItem("HGPT_USER_ANYTHING_ELSE",e.target.value);
    };

    return (
        <div className="mx-2 flex w-full flex-col items-center px-3 pt-4 sm:pt-8">
            <button
                className="mt-4 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50"
                onClick={() => setShowSettings(!showSettings)}
            >
                {showSettings ? "Hide" : "Show"} Settings
            </button>
            {showSettings && (
                <div className="justify-center space-x-2 flex">
                    {renderGroupButton({
                        title: "Authentication",
                        group: "authentication",
                        content: (
                            <div>
                                <SubGroupButton
                                    title="Sign In"
                                    style="bg-green-600"
                                    onClick={() => handleSubGroupButtonClick("credentials")}
                                />
                                {renderSubGroupContent("credentials",(
                                    <div>
                                        {renderInputField("email","Email",(e) => setEmail(e.target.value))}
                                        {renderInputField("password","Password",(e) => setPassword(e.target.value))}
                                        <SubGroupButton
                                            title="Sign In"
                                            onClick={handleSignIn}
                                        />
                                    </div>
                                ))}
                                <SubGroupButton
                                    title="Sign Up"
                                    style="bg-green-600"
                                    onClick={() => handleSubGroupButtonClick("signup")}
                                />
                                {renderSubGroupContent("signup",(
                                    <div>
                                        {renderInputField("email","Email",(e) => setEmail(e.target.value))}
                                        {renderInputField("password","Password",(e) => setPassword(e.target.value))}
                                        <SubGroupButton
                                            title="Free 5 Queries"
                                            onClick={handleFreeSignUp}
                                        />
                                        <SubGroupButton
                                            title="$5 for 50 Queries"
                                            onClick={handlePaidSignUp}
                                        />
                                    </div>
                                ))}
                                <SubGroupButton
                                    title="API Key"
                                    style="bg-green-600"
                                    onClick={() => handleSubGroupButtonClick("apiKey")}
                                />
                                {renderSubGroupContent("apiKey",(
                                    <div>
                                        {renderInputField("password","API Key",(e) => setApiKey(e.target.value))}
                                        <SubGroupButton
                                            title="Submit"
                                            onClick={handleApiKeySubmit}
                                        />
                                    </div>
                                ))}
                            </div>
                        ),
                    })}
                    {renderGroupButton({
                        title: "User Profile",
                        group: "userProfile",
                        content: (
                            <div>
                                <SubGroupButton
                                    title="Age Group"
                                    style="bg-blue-600"
                                    onClick={() => handleSubGroupButtonClick("ageGroup")}
                                />
                                {renderSubGroupContent("ageGroup",(
                                    <div className="mt-2">
                                        <select
                                            className="mt-2 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                            onChange={(e) => handleAgeGroupChange(e)}
                                            value={userAgeGroup}
                                        >
                                            <option value="<25">{"<25"}</option>
                                            <option value="25-35">25-35</option>
                                            <option value="35-45">35-45</option>
                                            <option value="45-60">45-60</option>
                                            <option value="60+">60+</option>
                                        </select>
                                    </div>
                                ))}
                                <SubGroupButton
                                    title="Sex"
                                    style="bg-blue-600"
                                    onClick={() => handleSubGroupButtonClick("sex")}
                                />
                                {renderSubGroupContent("sex",(
                                    <div className="mt-2">
                                        <select
                                            className="mt-2 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                            onChange={(e) => handleSexChange(e)}
                                            value={userSex}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Non-Binary">Non-Binary</option>
                                        </select>
                                    </div>
                                ))}
                                <SubGroupButton
                                    title="Fitness Level"
                                    style="bg-blue-600"
                                    onClick={() => handleSubGroupButtonClick("fitnessLevel")}
                                />
                                {renderSubGroupContent("fitnessLevel",(
                                    <div className="mt-2">
                                        <select
                                            className="mt-2 flex cursor-pointer items-center space-x-2 rounded-full border border-zinc-600 px-3 py-1 text-sm hover:opacity-50 text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm"
                                            onChange={(e) => handleFitnessLevelChange(e)}
                                            value={userFitnessLevel}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                ))}
                                <SubGroupButton
                                    title="Anything Else"
                                    style="bg-blue-600"
                                    onClick={() => handleSubGroupButtonClick("anythingElse")}
                                />
                                {renderSubGroupContent("anythingElse",(
                                    <div>
                                        {renderInputField("text","Additional context",(e) => handleAnythingElseInput(e))}
                                    </div>
                                ))}
                            </div>
                        ),
                    })}
                    {renderGroupButton({
                        title: "Search Parameters",
                        group: "searchParameters",
                        content: (
                            <div>
                                <SubGroupButton
                                    title="High-Level"
                                    style={userSearchParameters == "Highlevel" ? "bg-red-600" : "bg-red-400"}
                                    onClick={() => setUserSearchParameters("Highlevel")}
                                />
                                <SubGroupButton
                                    title="Detailed"
                                    style={userSearchParameters == "Detail" ? "bg-red-600" : "bg-red-400"}
                                    onClick={() => setUserSearchParameters("Detail")}
                                />
                                <SubGroupButton
                                    title="Pros v Cons"
                                    style={userSearchParameters == "ProsVCons" ? "bg-red-600" : "bg-red-400"}
                                    onClick={() => setUserSearchParameters("ProsVCons")}
                                />
                            </div>
                        ),
                    })}
                </div>
            )
            }
        </div >
    );
};

