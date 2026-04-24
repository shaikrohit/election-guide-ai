// Define the step-by-step flows for each persona
// Uses a data-driven approach for modularity

const Flows = {
    "first-time": {
        title: "First-Time Voter Guide",
        steps: [
            {
                id: "ft-1",
                title: "1. Check Eligibility & Register",
                desc: "Ensure you are 18+ and a citizen. Register online or at your local election office.",
                date: "2026-05-01T00:00:00Z",
                dateLabel: "Registration Deadline"
            },
            {
                id: "ft-2",
                title: "2. Verify Your Name",
                desc: "Check the electoral roll online to confirm your name is listed correctly.",
                date: "2026-05-15T00:00:00Z",
                dateLabel: "Verification Deadline"
            },
            {
                id: "ft-3",
                title: "3. Prepare Your ID",
                desc: "Gather valid identification (e.g., Voter ID card, Passport, or Driver's License)."
            },
            {
                id: "ft-4",
                title: "4. Voting Day",
                desc: "Visit your assigned polling station, verify your ID, and cast your vote in secret.",
                date: "2026-06-01T08:00:00Z",
                dateLabel: "Election Day"
            }
        ]
    },
    "regular": {
        title: "Regular Voter Guide",
        steps: [
            {
                id: "rv-1",
                title: "1. Verify Electoral Roll",
                desc: "Confirm your name is still on the voter list, especially if you recently moved.",
                date: "2026-05-15T00:00:00Z",
                dateLabel: "Verification Deadline"
            },
            {
                id: "rv-2",
                title: "2. Locate Polling Station",
                desc: "Check if your polling booth location has changed since the last election."
            },
            {
                id: "rv-3",
                title: "3. Cast Your Vote",
                desc: "Bring your Voter ID and cast your vote on election day.",
                date: "2026-06-01T08:00:00Z",
                dateLabel: "Election Day"
            }
        ]
    },
    "candidate": {
        title: "Candidate Guide",
        steps: [
            {
                id: "c-1",
                title: "1. File Nomination",
                desc: "Submit your nomination papers and affidavit to the Returning Officer.",
                date: "2026-05-05T00:00:00Z",
                dateLabel: "Nomination Deadline"
            },
            {
                id: "c-2",
                title: "2. Scrutiny & Withdrawal",
                desc: "Nominations are scrutinized. You have a window to withdraw if you choose.",
                date: "2026-05-12T00:00:00Z",
                dateLabel: "Withdrawal Deadline"
            },
            {
                id: "c-3",
                title: "3. Campaigning Phase",
                desc: "Adhere to the Model Code of Conduct while campaigning. Ends 48 hours before polling."
            },
            {
                id: "c-4",
                title: "4. Polling & Counting",
                desc: "Monitor polling booths via agents. Attend counting day.",
                date: "2026-06-05T08:00:00Z",
                dateLabel: "Counting Day"
            }
        ]
    }
};
