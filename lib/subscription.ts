export const createSubscription = async (planId: number,userId: number) => {

    const res = await fetch("api/create-subscription",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId,userId }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
    }
};

