import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
}

const app = initializeApp(config)
const db = getFirestore(app)

async function seed() {
  const jasmine = {
    name: "Jasmine Aikey",
    firstName: "Jasmine",
    sport: "Women’s Soccer • Midfielder",
    tagline: "All-America First Team 2023. Pac-12 Midfielder of the Year 2023. Two-time College Cup. ACC honors 2024.",
    heroImageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1470&auto=format&fit=crop",
    headshotUrl: "https://gostanford.com/imgproxy/bnk7b_7ewE7DRiny7Gl_9NJhuQA_CgYhBLoy36Mn_1w/rs:fit:1980:0:0/g:ce/q:90/aHR0cHM6Ly9zdG9yYWdlLmdvb2dsZWFwaXMuY29tL3N0YW5mb3JkLXByb2QvMjAyNC8wMS8yMi9hVWtTYVlvVlpabnJGS0VFaHhEUDdENkZHZEVSSHQ0MDNFcjZEaTZZLmpwZw.jpg",
    actionImageUrl: "https://images.unsplash.com/photo-1643922816532-2f89a2e6f0a8?q=80&w=1470&auto=format&fit=crop",
    stadiumBgUrl: "",
    badges: [
      "United Soccer Coaches All-America First Team (2023)",
      "Pac-12 Midfielder of the Year (2023)",
      "MAC Hermann Trophy Semifinalist (2023)",
      "Honda Sport Award Finalist (2023)",
      "All-ACC Second Team (2024)",
      "Pac-12 Champion (2022)",
      "College Cup Appearances (2023, 2024)"
    ],
    lessons: [
      { title: "Scanning and first-touch patterns", thumbnail: "https://gostanford.com/images/2023/10/1/WSOC_Action_Aikey_1.jpg", description: "Drills that build head-up scanning and tight control.", length: "12 min", level: "Intermediate" },
      { title: "Breaking lines from midfield", thumbnail: "https://gostanford.com/images/2023/10/1/WSOC_Action_Aikey_2.jpg", description: "Reading shape, timing the pass, and disguising intent.", length: "15 min", level: "Advanced" },
      { title: "Composure in the box", thumbnail: "https://gostanford.com/images/2023/10/1/WSOC_Action_Aikey_3.jpg", description: "Finish selection and body shape.", length: "11 min", level: "All levels" }
    ],
    createdAt: serverTimestamp()
  }

  await setDoc(doc(db, "creatorPublic", "jasmine-aikey"), jasmine)
  console.log("Seeded: creatorPublic/jasmine-aikey")
}

seed().catch(console.error)
