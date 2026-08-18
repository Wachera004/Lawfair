import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  getDocFromServer
} from "firebase/firestore";

dotenv.config();

// Initialize Firebase client for Firestore connection
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firestoreDb: any = null;
let firebaseConfig: any = null;

if (process.env.FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    console.log("🔥 Firebase configuration loaded from FIREBASE_CONFIG environment variable.");
  } catch (e) {
    console.error("❌ Failed to parse FIREBASE_CONFIG env variable:", e);
  }
} else if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    console.log("🔥 Firebase configuration loaded from firebase-applet-config.json.");
  } catch (e) {
    console.error("❌ Failed to read firebase-applet-config.json:", e);
  }
}

if (firebaseConfig) {
  try {
    const firebaseApp = initializeApp(firebaseConfig);
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || undefined);
    console.log("🔥 Firebase initialized successfully on server. Database ID:", firebaseConfig.firestoreDatabaseId || "(default)");
  } catch (e) {
    console.error("❌ Failed to initialize Firebase on server:", e);
  }
} else {
  console.warn("⚠️ Warning: No Firebase configuration found (either FIREBASE_CONFIG env variable or firebase-applet-config.json).");
}

async function testFirestoreConnection() {
  if (!firestoreDb) return;
  try {
    await getDocFromServer(doc(firestoreDb, "test", "connection"));
    console.log("✅ Successfully tested Firebase Firestore connection from server.");
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("client is offline")) {
      console.error("❌ Firebase client is offline. Please check your configuration.");
    } else {
      console.log("ℹ️ Tested Firestore connection (Database works):", error.message);
    }
  }
}

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const DATABASE_FILE = path.join(process.cwd(), "database.json");

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("⚠️ Warning: GEMINI_API_KEY is missing. AI features will fallback to high-quality simulated analysis.");
}

// Ensure database exists with initial pre-seeded data
const preSeededLawyers = [
  {
    id: "lawyer-1",
    name: "Wakili Sharon Odhiambo",
    firm: "Odhiambo & Co. Advocates",
    verified: true,
    activeRetainersCount: 14,
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "lawyer-2",
    name: "Wakili Evans Kamau",
    firm: "Kamau & Associated Solicitors",
    verified: true,
    activeRetainersCount: 28,
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  }
];

const preSeededMarketStats = [
  { neighborhood: "Kilimani, Nairobi", averageScore: 78, nonRefundableDepositPct: 45, averageDepositMonths: 1.5, totalContracts: 124 },
  { neighborhood: "Westlands, Nairobi", averageScore: 82, nonRefundableDepositPct: 35, averageDepositMonths: 2.0, totalContracts: 98 },
  { neighborhood: "Madaraka, Nairobi", averageScore: 68, nonRefundableDepositPct: 75, averageDepositMonths: 1.0, totalContracts: 156 },
  { neighborhood: "Roysambu, Nairobi", averageScore: 59, nonRefundableDepositPct: 85, averageDepositMonths: 1.0, totalContracts: 210 },
  { neighborhood: "Nairobi West", averageScore: 72, nonRefundableDepositPct: 60, averageDepositMonths: 1.5, totalContracts: 88 },
  { neighborhood: "Kileleshwa, Nairobi", averageScore: 85, nonRefundableDepositPct: 30, averageDepositMonths: 2.0, totalContracts: 115 }
];

const preSeededContracts = [
  {
    id: "contract-demo-1",
    tenantName: "Chèrabelle Edith",
    landlordName: "Mwangi Kuria",
    landlordPhone: "+254712345678",
    apartmentName: "Ridgeview Heights, Apt 4B",
    monthlyRent: 45000,
    depositAmount: 90000,
    status: "approved",
    fairnessScore: 64,
    riskLevel: "Medium",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    lawyerId: "lawyer-1",
    lawyerName: "Wakili Sharon Odhiambo",
    smsStatus: "accepted",
    summary: "Standard tenancy for Ridgeview Heights. Monthly rent is KES 45,000. Deposit is KES 90,000 (2 months). Water and service charge included. Landlord must give 2 months' notice prior to eviction. Tenant is liable for minor wear and tear.",
    clauses: [
      {
        id: "c1",
        title: "Eviction and Termination Notice",
        originalText: "The Landlord may terminate this agreement and evict the Tenant immediately if rent is late by more than 5 days, without any requirement for notice.",
        summary: "Allows immediate eviction for 5-day rent delay without notice.",
        status: "illegal",
        citation: "Section 4 of the Landlord and Tenant Act (Kenya): Tenants are entitled to a minimum of 1-month notice in writing. Additionally, the Eviction Guidelines under Kenyan Law require a court-ordered eviction order. Immediate eviction without notice is illegal and unenforceable.",
        recommendation: "Amend to: 'The landlord must provide at least 30 days written notice of default and termination as required by Kenyan law.'"
      },
      {
        id: "c2",
        title: "Rent Security Deposit Refund",
        originalText: "The security deposit of KES 90,000 is non-refundable and will be forfeited to cover administrative costs of lease ending.",
        summary: "Deposit is non-refundable and forfeited automatically.",
        status: "illegal",
        citation: "Standard Kenyan Law of Contract and tenancy principles: Security deposits are legally refundable and must be returned in full minus documented damage repairs. Contractual forfeiture clauses without damage are null and void.",
        recommendation: "Change to: 'Deposit shall be refunded in full within 14 days of lease termination, subject to inspection for damages beyond normal wear and tear.'"
      },
      {
        id: "c3",
        title: "Landlord Entry & Inspection",
        originalText: "The landlord or their agents may enter the premises at any time of day or night, without prior notice, to inspect the premises or perform repairs.",
        summary: "Permits landlord entry at any time without notice.",
        status: "warning",
        citation: "Section 80 of the Land Registration Act, 2012 (Kenya): Tenant is entitled to 'quiet enjoyment' of the property. The landlord's right of entry must be reasonable and subject to prior notification except in extreme emergencies.",
        recommendation: "Amend to: 'Landlord may enter the premises for inspection or repairs during reasonable daytime hours, with at least 24 hours prior written notice, except in emergencies.'"
      }
    ]
  },
  {
    id: "contract-demo-2",
    tenantName: "Brian Omondi",
    landlordName: "Grace Wanjiku",
    landlordPhone: "+254722888999",
    apartmentName: "Huria Court, Westlands",
    monthlyRent: 60000,
    depositAmount: 180000,
    status: "pending_review",
    fairnessScore: 48,
    riskLevel: "High",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    smsStatus: "not_sent",
    summary: "Westlands residency for KES 60,000/month. Demands a 3-month deposit (KES 180,000) and contains clauses giving the landlord power to lock the house/seize belongings immediately on rent delay.",
    clauses: [
      {
        id: "c2-1",
        title: "Security Deposit Amount",
        originalText: "The Tenant shall pay a security deposit equivalent to 3 months' rent (KES 180,000) prior to taking occupancy.",
        summary: "Requires 3 months' rent as a security deposit.",
        status: "warning",
        citation: "Section 13 of the Rent Restriction Act (Kenya): For standard tenancies, security deposits are capped at a maximum of 2 months' rent. Although Westlands high-end units sometimes bypass controlled tenancy limits, a 3-month deposit is widely considered excessive and heavily biased.",
        recommendation: "Negotiate deposit down to KES 120,000 (2 months' rent) to match standard Rent Act practices."
      },
      {
        id: "c2-2",
        title: "Locking of Premises & Distress",
        originalText: "Upon default of rent by 7 days, the landlord is fully authorized to lock the premises, disconnect utilities, and auction tenant's personal properties to recover outstanding rent.",
        summary: "Landlord can lock the house, cut utility connections, and auction items.",
        status: "illegal",
        citation: "Distress for Rent Act (Cap 293, Kenya): Landlords must use a licensed court auctioneer to levy distress. Locking out tenants and disconnecting utilities without a Rent Tribunal or Court order violates constitutional rights to housing and is illegal under Kenyan land law.",
        recommendation: "Amend to: 'Any dispute regarding default of rent shall be referred to the Rent Restriction Tribunal or resolved in accordance with the Distress for Rent Act using licensed court bailiffs.'"
      }
    ]
  }
];

const preSeededDisputes = [
  {
    id: "dispute-demo-1",
    contractId: "contract-demo-1",
    disputeType: "deposit_retention",
    description: "The landlord Mwangi Kuria is refusing to refund my KES 90,000 deposit. He claims he needs it to repaint the entire apartment, even though we lived there for 11 months and there is only minor standard wear on the walls. No photos of damages have been shared.",
    status: "active",
    demandLetter: `ADVOCATE'S DEMAND LETTER & NOTICE OF INTENTION TO SUE

Date: July 18, 2026

TO:
MWANGI KURIA
Landlord, Ridgeview Heights
Nairobi, Kenya

RE: DEMAND FOR IMMEDIATE REFUND OF TENANCY DEPOSIT FOR RIDGEVIEW HEIGHTS, APT 4B (TENANT: CHÈRABELLE EDITH)

We act on behalf of our client, Ms. Chèrabelle Edith (the "Tenant"), under the legal custody and retainer terms of LeaseGuardian / MakaziShield.

We write to demand the immediate release and refund of the tenancy security deposit amounting to KES 90,000.00 (Ninety Thousand Kenyan Shillings) held by you since the inception of the tenancy in August 2025.

Our client vacated the premises on July 10, 2026, after serving the requisite notice. Despite a joint move-out inspection confirming no structural damages beyond ordinary wear and tear, you have wrongfully withheld the deposit under the pretext of 'repainting expenses'.

TAKE NOTICE that under Kenyan Tenancy Law and established judicial precedent, a landlord cannot withhold a tenant's security deposit to cover ordinary wear and tear (such as minor wall scuffs from normal use). Furthermore, Section 13 of the Rent Restriction Act (Cap 296) and general principles of land law require deposit refunds to be processed transparently.

We hereby DEMAND that you refund the sum of KES 90,000.00 in full to our client's designated mobile wallet within forty-eight (48) hours of receipt of this letter.

FAILURE TO COMPLY will leave us with no option but to file a dispute before the Rent Restriction Tribunal (RRT) or the Land Environment Court to seek:
1. The full refund of KES 90,000.00.
2. Interest thereon at commercial bank rates from the date of vacating.
3. Legal representation costs, which will be claimed entirely against you.

Please be advised accordingly and avoid costly legal proceedings.

Yours Sincerely,
__________________________
Wakili Sharon Odhiambo, Esq.
Managing Partner, Odhiambo & Co. Advocates
On behalf of LeaseGuardian Legal Custody Team`,
    activatedAt: new Date().toISOString()
  }
];

function initDB() {
  const defaultUsers = [
    {
      id: "user-landlord-1",
      username: "landlord",
      password: "password",
      name: "Mwangi Kuria",
      role: "landlord"
    },
    {
      id: "user-tenant-1",
      username: "tenant",
      password: "password",
      name: "Chèrabelle Edith",
      role: "tenant"
    },
    {
      id: "user-lawyer-1",
      username: "lawyer",
      password: "password",
      name: "Wakili Sharon Odhiambo",
      role: "lawyer",
      firm: "Odhiambo & Co. Advocates"
    }
  ];

  if (!fs.existsSync(DATABASE_FILE)) {
    const defaultData = {
      contracts: preSeededContracts,
      disputes: preSeededDisputes,
      lawyers: preSeededLawyers,
      marketStats: preSeededMarketStats,
      smsLogs: [] as any[],
      users: defaultUsers
    };
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DATABASE_FILE, "utf-8"));
    let modified = false;
    if (!data.users) {
      data.users = defaultUsers;
      modified = true;
    }
    if (!data.lawyers || data.lawyers.length === 0) {
      data.lawyers = preSeededLawyers;
      modified = true;
    }
    if (modified) {
      fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (e) {
    console.error("Error reading database file, resetting:", e);
    const defaultData = {
      contracts: preSeededContracts,
      disputes: preSeededDisputes,
      lawyers: preSeededLawyers,
      marketStats: preSeededMarketStats,
      smsLogs: [] as any[],
      users: defaultUsers
    };
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing database file:", e);
  }
}

// REST APIs
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    let user: any = null;
    if (firestoreDb) {
      const q = query(collection(firestoreDb, "users"), where("username", "==", username.trim()));
      const snap = await getDocs(q);
      snap.forEach((docSnap) => {
        const u = docSnap.data();
        if (u.password === password) {
          user = u;
        }
      });
    } else {
      const localDb = initDB();
      user = localDb.users.find(
        (u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (err: any) {
    console.error("Auth login error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, "users"));
      const users: any[] = [];
      snap.forEach((docSnap) => {
        const { password, ...u } = docSnap.data();
        users.push(u);
      });
      res.json(users);
    } else {
      const localDb = initDB();
      const usersWithoutPasswords = localDb.users.map(({ password, ...u }: any) => u);
      res.json(usersWithoutPasswords);
    }
  } catch (err: any) {
    console.error("Get users error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  const { username, password, name, role, firm } = req.body;
  if (!username || !password || !name || !role) {
    return res.status(400).json({ error: "Missing required user parameters." });
  }

  try {
    const userId = "user-" + Date.now();
    const newUser = {
      id: userId,
      username: username.trim(),
      password: password.trim(),
      name: name.trim(),
      role,
      ...(role === "lawyer" ? { firm: firm || "Independent Advocate" } : {})
    };

    if (firestoreDb) {
      // Check if username already exists
      const q = query(collection(firestoreDb, "users"), where("username", "==", username.trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return res.status(400).json({ error: "Username already exists." });
      }

      await setDoc(doc(firestoreDb, "users", userId), newUser);

      if (role === "lawyer") {
        await setDoc(doc(firestoreDb, "lawyers", userId), {
          id: userId,
          name: name.trim(),
          firm: firm || "Independent Advocate",
          verified: true,
          activeRetainersCount: 0,
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        });
      }
    } else {
      const localDb = initDB();
      const exists = localDb.users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        return res.status(400).json({ error: "Username already exists." });
      }

      localDb.users.push(newUser);

      if (role === "lawyer") {
        localDb.lawyers.push({
          id: userId,
          name: name.trim(),
          firm: firm || "Independent Advocate",
          verified: true,
          activeRetainersCount: 0,
          avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
        });
      }
      saveDB(localDb);
    }

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (err: any) {
    console.error("Create user error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    if (firestoreDb) {
      const userRef = doc(firestoreDb, "users", userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data()?.username === "landlord") {
        return res.status(400).json({ error: "Cannot delete the primary landlord account." });
      }

      await deleteDoc(userRef);
      await deleteDoc(doc(firestoreDb, "lawyers", userId));
    } else {
      const localDb = initDB();
      const userToDelete = localDb.users.find((u: any) => u.id === userId);
      if (userToDelete && userToDelete.username === "landlord") {
        return res.status(400).json({ error: "Cannot delete the primary landlord account." });
      }

      localDb.users = localDb.users.filter((u: any) => u.id !== userId);
      localDb.lawyers = localDb.lawyers.filter((l: any) => l.id !== userId);
      saveDB(localDb);
    }

    res.json({ success: true, message: "User deleted successfully." });
  } catch (err: any) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contracts", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, "contracts"));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      // Sort by createdAt descending
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(list);
    } else {
      const localDb = initDB();
      res.json(localDb.contracts);
    }
  } catch (err: any) {
    console.error("Get contracts error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/contracts/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (firestoreDb) {
      const docSnap = await getDoc(doc(firestoreDb, "contracts", id));
      if (!docSnap.exists()) {
        return res.status(404).json({ error: "Contract not found" });
      }
      res.json(docSnap.data());
    } else {
      const localDb = initDB();
      const contract = localDb.contracts.find((c: any) => c.id === id);
      if (!contract) return res.status(404).json({ error: "Contract not found" });
      res.json(contract);
    }
  } catch (err: any) {
    console.error("Get contract error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create and analyze contract
app.post("/api/contracts", async (req, res) => {
  const { tenantName, landlordName, landlordPhone, apartmentName, monthlyRent, depositAmount, fileContent } = req.body;

  if (!tenantName || !landlordName || !apartmentName || !monthlyRent || !depositAmount) {
    return res.status(400).json({ error: "Missing required contract parameters." });
  }

  const db = initDB();
  const contractId = "contract-" + Date.now();

  // Create base contract structure
  let contract: any = {
    id: contractId,
    tenantName,
    landlordName,
    landlordPhone: landlordPhone || "+254700000000",
    apartmentName,
    monthlyRent: Number(monthlyRent),
    depositAmount: Number(depositAmount),
    status: "pending_review",
    fairnessScore: 70, // default placeholder
    riskLevel: "Medium", // default placeholder
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    smsStatus: "not_sent",
    summary: "Lease contract for " + apartmentName + ". Rent: KES " + monthlyRent + ". Deposit: KES " + depositAmount,
    clauses: [],
    fileContent: fileContent || ""
  };

  // Perform AI analysis if Gemini is set up
  if (ai) {
    try {
      const leaseTextToAnalyze = fileContent || `
        Tenancy Agreement between ${landlordName} (Landlord) and ${tenantName} (Tenant).
        Premises: ${apartmentName}.
        Rent: KES ${monthlyRent} per month.
        Deposit: KES ${depositAmount} refundable.
        Terms:
        1. Landlord can evict the tenant with 3 days notice if they make noise or delay rent.
        2. Deposit will not be refunded if the tenant leaves before 1 year, even if they give proper notice.
        3. Landlord may enter the house at any time to inspect.
        4. If rent is delayed, landlord can lock the doors and seize tenant properties.
      `;

      const prompt = `
        Analyze the following lease agreement text for an apartment in Kenya.
        Identify specific clauses that favor the landlord excessively or violate Kenyan laws.
        In particular, verify compliance with:
        - The Rent Restriction Act (Cap 296) (e.g. caps on security deposits at 2 months' rent).
        - The distress for Rent Act (Cap 293) (e.g. landlords locking out tenants or seizing property without a court order is illegal).
        - Land Registration Act, 2012 / Land Act, 2012 (e.g. tenant's right to quiet enjoyment, minimum written notices for default or eviction - usually 30 days or more).
        - Fairness of deposit return conditions (e.g. non-refundable deposit clauses are illegal).

        Bilingual capability (English & Swahili):
        - Check if the lease text is in Swahili (Kiswahili) or contains significant Swahili terms (e.g., "mkataba", "upangaji", "mpangaji", "mwenye nyumba", "amana", "kodi", "funga", "nyumba").
        - If the document is in Swahili or contains Swahili lease terms, translate/analyze them accurately, and return the output fields ("summary" and each clause's "title", "summary", "citation", "recommendation") in a clear, professional bilingual format (using both Swahili and English, e.g. "Kibali cha Kuingia / Right of Entry" or providing Swahili descriptions alongside English legal terms).
        - Ensure Swahili-speaking tenants can understand their rights under Kenyan law as clearly as English-speaking tenants.

        Lease context details:
        - Tenant Name: ${tenantName}
        - Landlord Name: ${landlordName}
        - Apartment: ${apartmentName}
        - Monthly Rent: KES ${monthlyRent}
        - Deposit Paid: KES ${depositAmount}

        Lease text to analyze:
        ${leaseTextToAnalyze}

        Please return a strictly formatted JSON object adhering exactly to the following structure:
        {
          "fairnessScore": 75, // A score from 0 to 100 where 100 is perfectly fair to the tenant, and 0 is entirely landlord biased / illegal
          "riskLevel": "Low" | "Medium" | "High",
          "summary": "Plain English/Swahili-mix highly scannable summary of terms, major points, and responsibilities.",
          "clauses": [
            {
              "title": "Clause name",
              "originalText": "The text from the lease that this refers to",
              "summary": "Short explanation of what this clause does",
              "status": "compliant" | "warning" | "illegal",
              "citation": "Exact citation of Kenyan law (e.g., Section 13 Rent Restriction Act, Distress for Rent Act Cap 293, Land Registration Act 2012) explaining exactly how it violates or complies with the law. Make it sound professional and authoritative.",
              "recommendation": "Exact recommended wording or action for the tenant to negotiate."
            }
          ]
        }
      `;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              fairnessScore: { type: Type.INTEGER, description: "Tenancy fairness score 0-100" },
              riskLevel: { type: Type.STRING, description: "Risk level: Low, Medium, or High" },
              summary: { type: Type.STRING, description: "A clean plain language summary of the agreement" },
              clauses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    originalText: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    status: { type: Type.STRING, description: "compliant, warning, or illegal" },
                    citation: { type: Type.STRING, description: "Exact Kenyan law code citation" },
                    recommendation: { type: Type.STRING }
                  },
                  required: ["title", "originalText", "summary", "status"]
                }
              }
            },
            required: ["fairnessScore", "riskLevel", "summary", "clauses"]
          }
        }
      });

      const parsed = JSON.parse(aiResponse.text || "{}");
      contract = {
        ...contract,
        fairnessScore: parsed.fairnessScore ?? 70,
        riskLevel: parsed.riskLevel ?? "Medium",
        summary: parsed.summary ?? contract.summary,
        clauses: (parsed.clauses ?? []).map((c: any, index: number) => ({
          ...c,
          id: `clause-${Date.now()}-${index}`
        }))
      };
    } catch (error) {
      console.error("Gemini analysis error:", error);
      // Fallback to high-quality simulated analysis for the demo if there's an API error
      contract = generateSimulatedAnalysis(contract);
    }
  } else {
    // Generate simulated analysis if API key is not present
    contract = generateSimulatedAnalysis(contract);
  }

  if (firestoreDb) {
    try {
      await setDoc(doc(firestoreDb, "contracts", contractId), contract);
    } catch (err) {
      console.error("Error saving contract to Firestore:", err);
    }
  } else {
    db.contracts.unshift(contract);
    saveDB(db);
  }
  res.status(201).json(contract);
});

// Update contract terms (simulate Landlord editing terms)
app.put("/api/contracts/:id", async (req, res) => {
  const { monthlyRent, depositAmount, clauseUpdates, updateNotes } = req.body;
  const { id } = req.params;

  try {
    let oldContract: any = null;

    if (firestoreDb) {
      const docSnap = await getDoc(doc(firestoreDb, "contracts", id));
      if (docSnap.exists()) {
        oldContract = docSnap.data();
      }
    } else {
      const localDb = initDB();
      oldContract = localDb.contracts.find((c: any) => c.id === id);
    }

    if (!oldContract) {
      return res.status(404).json({ error: "Contract not found" });
    }

    // Apply updates
    const updatedContract = {
      ...oldContract,
      monthlyRent: monthlyRent ? Number(monthlyRent) : oldContract.monthlyRent,
      depositAmount: depositAmount ? Number(depositAmount) : oldContract.depositAmount,
      status: "pending_review", // Reset status to trigger lawyer review!
      smsStatus: "not_sent", // Reset SMS agreements
      updatedAt: new Date().toISOString(),
      lastUpdateNotes: updateNotes || "Terms modified by landlord.",
      clauses: (oldContract.clauses || []).map((c: any) => {
        const match = (clauseUpdates || []).find((u: any) => u.id === c.id);
        if (match) {
          return {
            ...c,
            originalText: match.originalText || c.originalText,
            status: match.status || "compliant", // landlord assumes compliant now
            recommendation: "Review modified wording."
          };
        }
        return c;
      })
    };

    // Recalculate score based on resolved issues
    const illegalCount = updatedContract.clauses.filter((c: any) => c.status === "illegal").length;
    const warningCount = updatedContract.clauses.filter((c: any) => c.status === "warning").length;
    updatedContract.fairnessScore = Math.min(100, Math.max(30, 95 - (illegalCount * 15) - (warningCount * 5)));
    updatedContract.riskLevel = updatedContract.fairnessScore > 80 ? "Low" : updatedContract.fairnessScore > 60 ? "Medium" : "High";

    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "contracts", id), updatedContract);
    } else {
      const localDb = initDB();
      const index = localDb.contracts.findIndex((c: any) => c.id === id);
      if (index !== -1) {
        localDb.contracts[index] = updatedContract;
        saveDB(localDb);
      }
    }

    res.json(updatedContract);
  } catch (err: any) {
    console.error("Update contract error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lawyer approves contract
app.post("/api/contracts/:id/approve", async (req, res) => {
  const { lawyerId } = req.body;
  const { id } = req.params;

  try {
    if (firestoreDb) {
      const contractRef = doc(firestoreDb, "contracts", id);
      const contractSnap = await getDoc(contractRef);
      if (!contractSnap.exists()) {
        return res.status(404).json({ error: "Contract not found" });
      }

      const contract = contractSnap.data();
      const targetLawyerId = lawyerId || "lawyer-1";
      const lawyerRef = doc(firestoreDb, "lawyers", targetLawyerId);
      const lawyerSnap = await getDoc(lawyerRef);

      let lawyer = { id: targetLawyerId, name: "Wakili Sharon Odhiambo", activeRetainersCount: 0 };
      if (lawyerSnap.exists()) {
        const lData = lawyerSnap.data();
        lawyer = { id: targetLawyerId, name: lData.name, activeRetainersCount: lData.activeRetainersCount || 0 };
      }

      contract.status = "approved";
      contract.lawyerId = lawyer.id;
      contract.lawyerName = lawyer.name;
      contract.updatedAt = new Date().toISOString();

      lawyer.activeRetainersCount += 1;

      await setDoc(contractRef, contract);
      await updateDoc(lawyerRef, { activeRetainersCount: lawyer.activeRetainersCount });
      res.json(contract);
    } else {
      const localDb = initDB();
      const contract = localDb.contracts.find((c: any) => c.id === id);
      if (!contract) return res.status(404).json({ error: "Contract not found" });

      const lawyer = localDb.lawyers.find((l: any) => l.id === (lawyerId || "lawyer-1")) || localDb.lawyers[0];

      contract.status = "approved";
      contract.lawyerId = lawyer.id;
      contract.lawyerName = lawyer.name;
      contract.updatedAt = new Date().toISOString();

      lawyer.activeRetainersCount += 1;

      saveDB(localDb);
      res.json(contract);
    }
  } catch (err: any) {
    console.error("Approve contract error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Lawyer requests revisions
app.post("/api/contracts/:id/request-revision", async (req, res) => {
  const { id } = req.params;

  try {
    if (firestoreDb) {
      const contractRef = doc(firestoreDb, "contracts", id);
      const contractSnap = await getDoc(contractRef);
      if (!contractSnap.exists()) {
        return res.status(404).json({ error: "Contract not found" });
      }

      const contract = contractSnap.data();
      contract.status = "revision_requested";
      contract.updatedAt = new Date().toISOString();

      await setDoc(contractRef, contract);
      res.json(contract);
    } else {
      const localDb = initDB();
      const contract = localDb.contracts.find((c: any) => c.id === id);
      if (!contract) return res.status(404).json({ error: "Contract not found" });

      contract.status = "revision_requested";
      contract.updatedAt = new Date().toISOString();

      saveDB(localDb);
      res.json(contract);
    }
  } catch (err: any) {
    console.error("Request revision error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simulated SMS Sending (Africa's Talking Mock API)
app.post("/api/contracts/:id/send-sms", async (req, res) => {
  const { id } = req.params;
  try {
    let contract: any = null;
    let db: any = null;
    if (firestoreDb) {
      const contractRef = doc(firestoreDb, "contracts", id);
      const contractSnap = await getDoc(contractRef);
      if (contractSnap.exists()) {
        contract = contractSnap.data();
      }
    } else {
      db = initDB();
      contract = db.contracts.find((c: any) => c.id === id);
    }

    if (!contract) return res.status(404).json({ error: "Contract not found" });

    contract.smsStatus = "sent";
    contract.updatedAt = new Date().toISOString();

    // Create SMS Log
    const smsMessage = `LeaseGuardian Term Summary for Apt ${contract.apartmentName}: 
Rent: KES ${contract.monthlyRent}/m. Dep: KES ${contract.depositAmount}. 
Terms approved by advocate ${contract.lawyerName || "LeaseGuardian Counsel"}. 
Please acknowledge terms and legal retainer custody by replying YES.`;

    const smsLogId = "sms-" + Date.now();
    const smsLog = {
      id: smsLogId,
      contractId: contract.id,
      phone: contract.landlordPhone,
      direction: "outbound",
      message: smsMessage,
      timestamp: new Date().toISOString()
    };

    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "contracts", id), contract);
      await setDoc(doc(firestoreDb, "smsLogs", smsLogId), smsLog);
    } else {
      const idx = db.contracts.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        db.contracts[idx] = contract;
      }
      db.smsLogs.push(smsLog);
      saveDB(db);
    }

    res.json({ success: true, contract, smsMessage });
  } catch (err: any) {
    console.error("Send SMS error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Simulated SMS Response from Landlord
app.post("/api/contracts/:id/landlord-respond", async (req, res) => {
  const { responseText } = req.body; // "YES" or "NO"
  const { id } = req.params;

  try {
    let contract: any = null;
    let db: any = null;
    if (firestoreDb) {
      const contractRef = doc(firestoreDb, "contracts", id);
      const contractSnap = await getDoc(contractRef);
      if (contractSnap.exists()) {
        contract = contractSnap.data();
      }
    } else {
      db = initDB();
      contract = db.contracts.find((c: any) => c.id === id);
    }

    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const responseTextClean = (responseText || "YES").trim().toUpperCase();

    const smsLogId = "sms-resp-" + Date.now();
    const smsLog = {
      id: smsLogId,
      contractId: contract.id,
      phone: contract.landlordPhone,
      direction: "inbound",
      message: responseTextClean,
      timestamp: new Date().toISOString()
    };

    if (responseTextClean === "YES") {
      contract.smsStatus = "accepted";
    } else {
      contract.smsStatus = "declined";
    }
    contract.updatedAt = new Date().toISOString();

    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "contracts", id), contract);
      await setDoc(doc(firestoreDb, "smsLogs", smsLogId), smsLog);
    } else {
      const idx = db.contracts.findIndex((c: any) => c.id === id);
      if (idx !== -1) {
        db.contracts[idx] = contract;
      }
      db.smsLogs.push(smsLog);
      saveDB(db);
    }

    res.json(contract);
  } catch (err: any) {
    console.error("Landlord respond SMS error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Disputes
app.get("/api/disputes", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, "disputes"));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      list.sort((a, b) => new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime());
      res.json(list);
    } else {
      const localDb = initDB();
      res.json(localDb.disputes);
    }
  } catch (err: any) {
    console.error("Get disputes error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create and activate dispute (compile demand letter via Gemini)
app.post("/api/disputes", async (req, res) => {
  const { contractId, disputeType, description } = req.body;

  if (!contractId || !disputeType || !description) {
    return res.status(400).json({ error: "Missing required dispute parameters." });
  }

  try {
    let contract: any = null;
    let db: any = null;
    if (firestoreDb) {
      const contractSnap = await getDoc(doc(firestoreDb, "contracts", contractId));
      if (contractSnap.exists()) {
        contract = contractSnap.data();
      }
    } else {
      db = initDB();
      contract = db.contracts.find((c: any) => c.id === contractId);
    }

    if (!contract) return res.status(404).json({ error: "Contract not found" });

    const disputeId = "dispute-" + Date.now();
    let demandLetter = "";

    if (ai) {
      try {
        const prompt = `
          Draft an official legal demand letter from a qualified Kenyan advocate on behalf of a tenant.
          The tenant has activated their "LeaseGuardian" Retainer Protection.

          Tenant Name: ${contract.tenantName}
          Landlord Name: ${contract.landlordName}
          Property: ${contract.apartmentName}
          Rent Amount: KES ${contract.monthlyRent}
          Deposit Paid: KES ${contract.depositAmount}
          Assigned Advocate: ${contract.lawyerName || "Sharon Odhiambo, Esq."}

          Dispute Details:
          Type of dispute: ${disputeType}
          Description: ${description}

          Requirements:
          1. Write in a formal, stern, and professional Kenyan legal style.
          2. Reference specific applicable Kenyan laws based on the dispute type:
             - For Security Deposit Retention: cite general principles of Kenyan Contract Law, and Section 13 of the Rent Restriction Act (if applicable) stating wear and tear is not deductable.
             - For Wrongful Eviction: cite Section 4 of the Landlord and Tenant Act and Section 80 of the Land Registration Act 2012, stating a landlord cannot locks out a tenant or evict them without a court/tribunal order and adequate written notices (minimum 30 days).
             - For Repair Breaches: cite landlord's covenant to repair under Section 80 of the Land Registration Act.
          3. Issue a clear 48-hour or 7-day ultimatum to return the money/resolve the issue, failing which legal proceedings will commence before the Rent Restriction Tribunal (RRT) or Environment and Land Court of Kenya.
          4. Sign on behalf of LeaseGuardian Legal Custody Team.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
        });

        demandLetter = response.text || "";
      } catch (e) {
        console.error("Gemini demand letter generation failed:", e);
        demandLetter = generateSimulatedDemandLetter(contract, disputeType, description);
      }
    } else {
      demandLetter = generateSimulatedDemandLetter(contract, disputeType, description);
    }

    const newDispute = {
      id: disputeId,
      contractId,
      disputeType,
      description,
      status: "active",
      demandLetter,
      activatedAt: new Date().toISOString()
    };

    if (firestoreDb) {
      await setDoc(doc(firestoreDb, "disputes", disputeId), newDispute);
    } else {
      db.disputes.unshift(newDispute);
      saveDB(db);
    }

    res.status(201).json(newDispute);
  } catch (err: any) {
    console.error("Create dispute error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/market-stats", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, "marketStats"));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      res.json(list);
    } else {
      const localDb = initDB();
      res.json(localDb.marketStats);
    }
  } catch (err: any) {
    console.error("Get market-stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/lawyers", async (req, res) => {
  try {
    if (firestoreDb) {
      const snap = await getDocs(collection(firestoreDb, "lawyers"));
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      res.json(list);
    } else {
      const localDb = initDB();
      res.json(localDb.lawyers);
    }
  } catch (err: any) {
    console.error("Get lawyers error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sms-logs/:contractId", async (req, res) => {
  const { contractId } = req.params;
  try {
    if (firestoreDb) {
      const q = query(collection(firestoreDb, "smsLogs"), where("contractId", "==", contractId));
      const snap = await getDocs(q);
      const list: any[] = [];
      snap.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      res.json(list);
    } else {
      const localDb = initDB();
      const logs = localDb.smsLogs.filter((l: any) => l.contractId === contractId);
      res.json(logs);
    }
  } catch (err: any) {
    console.error("Get sms-logs error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Helper for generating standard simulated analysis in case of failures or missing key
function generateSimulatedAnalysis(contract: any): any {
  const isSwahili = (contract.fileContent && /mkataba|upangaji|mpangaji|mwenye nyumba|kodi|amana|funga|nyumba/i.test(contract.fileContent));
  
  let score = 75;
  let risk: "Low" | "Medium" | "High" = "Medium";
  let summary = isSwahili 
    ? `Mkataba wa upangaji (Lease agreement) wa ${contract.apartmentName}. Kodi ya kila mwezi ni KES ${contract.monthlyRent} na amana (deposit) ni KES ${contract.depositAmount}. Mkataba unahusu masharti ya kuishi, matengenezo, na malipo ya maji na umeme.`
    : `Tenancy for ${contract.apartmentName}. Monthly rent of KES ${contract.monthlyRent} and deposit of KES ${contract.depositAmount}. The agreement covers occupancy terms, maintenance, and utility bills.`;

  const clauses = isSwahili ? [
    {
      id: "sim-c1",
      title: "Kuchelewa kwa kodi na Kufungiwa Mlango (Tenant Default & Locking Out)",
      originalText: "Mwenye nyumba ana haki ya kufunga mlango wa nyumba, kukata maji na umeme, na kutaifisha mali zote za ndani kama kodi imecheleweshwa.",
      summary: "Inamruhusu mwenye nyumba kumfungia mpangaji nje na kutaifisha mali zake kodi ikichelewa.",
      status: "illegal",
      citation: "Sheria ya Distress for Rent Act (Cap 293, Laws of Kenya): Sehemu ya 3 inataka hatua zote za kutaifisha mali kwa ajili ya kodi zifanywe na dalali wa mahakama aliyeidhinishwa pekee. Kuchukua hatua mkononi kama kufunga milango au kukata maji/umeme ni kinyume cha sheria na inakiuka haki ya mpangaji ya 'quiet enjoyment'.",
      recommendation: "Omba kufutwa kwa kifungu cha kujichukulia hatua mkononi na badala yake iwekwe taratibu rasmi za kisheria au kuwasilisha malalamishi kwenye Baraza la Kupunguza Kodi (Rent Restriction Tribunal)."
    },
    {
      id: "sim-c2",
      title: "Kazuio la Amana (Security Deposit Forfeiture)",
      originalText: "Amana (deposit) haitatajika kurejeshwa kwa vyovyote vile baada ya mkataba kuisha na itachukuliwa na mwenye nyumba.",
      summary: "Amana ya mpangaji inazuiliwa na kutaifishwa moja kwa moja bila sababu punde tu mkataba unapoisha.",
      status: "illegal",
      citation: "Sheria ya Mikataba ya Kenya (Law of Contract) na maamuzi ya mahakama ya upangaji: Amana ni mali ya mpangaji na lazima irejeshwe kikamilifu. Mwenye nyumba anaweza tu kukata gharama zilizothibitishwa za uharibifu wa nyumba unaozidi ule wa kawaida (wear and tear), akiwa na risiti rasmi.",
      recommendation: "Badilisha kifungu kisomeke hivi: 'Amana itashikiliwa kwa uaminifu na kurejeshwa kikamilifu ndani ya siku 14 baada ya kukomesha upangaji, baada ya ukaguzi wa uharibifu unaozidi uchakavu wa kawaida.'"
    }
  ] : [
    {
      id: "sim-c1",
      title: "Tenant Default & Locking Out",
      originalText: "If the rent shall be unpaid for more than seven (7) days, the landlord shall have the right to lock the house, re-enter the premises, and seize any properties to offset the balance.",
      summary: "Allows landlord to lockout tenant and seize belongings for 7-day rent delay.",
      status: "illegal",
      citation: "Distress for Rent Act (Cap 293, Laws of Kenya): Section 3 requires any levying of distress for rent to be conducted strictly by a licensed court bailiff/auctioneer. Self-help measures like changing locks or disconnecting utilities are illegal and constitute a breach of quiet enjoyment.",
      recommendation: "Request deletion of self-help locking and replace with standard legal arbitration or Rent Restriction Tribunal procedure."
    },
    {
      id: "sim-c2",
      title: "Security Deposit Forfeiture",
      originalText: "The security deposit paid at move-in is strictly non-refundable and shall be retained by the landlord as a liquidation charge at the end of tenancy.",
      summary: "Tenant security deposit is automatically forfeited upon move-out.",
      status: "illegal",
      citation: "Kenyan Law of Contract & Tenancy precedents: Security deposits are strictly refundable. Landlords can only make deductions for documented damages beyond reasonable wear and tear, backed by receipts.",
      recommendation: "Replace with: 'The security deposit shall be held in trust and refunded in full within 14 days of lease termination, subject to inspection for damage exceeding reasonable wear and tear.'"
    }
  ];

  // If deposit is larger than 2 months, add warning
  if (contract.depositAmount > contract.monthlyRent * 2) {
    score = 55;
    risk = "High";
    if (isSwahili) {
      clauses.push({
        id: "sim-c3",
        title: "Amana ya Juu Kupita Kiasi (Excessive Security Deposit)",
        originalText: `Mpangaji atalipa amana ya KES ${contract.depositAmount} (sawa na kodi ya miezi ${Math.round(contract.depositAmount / contract.monthlyRent * 10) / 10}).`,
        summary: `Inadai amana ya usalama ya juu kuliko kodi ya miezi miwili.`,
        status: "warning",
        citation: "Sheria ya Rent Restriction Act (Cap 296, Kenya) - Sehemu ya 13: Inazuia amana ya usalama kuzidi kodi ya miezi miwili pekee. Amana yoyote ya juu zaidi ni kinyume cha sheria na inaweka mzigo usio wa haki kwa mpangaji.",
        recommendation: `Majadiliano yapunguze amana hadi KES ${contract.monthlyRent * 2} (kodi ya miezi 2).`
      });
    } else {
      clauses.push({
        id: "sim-c3",
        title: "Excessive Security Deposit",
        originalText: `The tenant shall pay a security deposit of KES ${contract.depositAmount} (equivalent to ${Math.round(contract.depositAmount / contract.monthlyRent * 10) / 10} months' rent).`,
        summary: `Requires a security deposit higher than two months' rent.`,
        status: "warning",
        citation: "Rent Restriction Act (Cap 296, Kenya) - Section 13: Caps security deposits at a maximum of two months' rent. Any higher deposit is legally questionable and places an asymmetric financial burden on the tenant.",
        recommendation: `Negotiate to cap the security deposit at KES ${contract.monthlyRent * 2} (2 months' rent).`
      });
    }
  } else {
    score = 65;
    risk = "Medium";
  }

  return {
    ...contract,
    fairnessScore: score,
    riskLevel: risk,
    summary,
    clauses
  };
}

// Helper for generating standard demand letter in case of failures or missing key
function generateSimulatedDemandLetter(contract: any, disputeType: string, description: string): string {
  const typeLabels: Record<string, string> = {
    deposit_retention: "WRONGFUL RETENTION OF SECURITY DEPOSIT",
    wrongful_eviction: "WRONGFUL EVICTION & ILLEGAL LOCKOUT",
    repair_breach: "BREACH OF REPAIR AND MAINTENANCE COVENANTS",
    other: "TENANCY DISPUTE AND NOTICE OF BREACH"
  };

  const lawsCited = disputeType === "deposit_retention" 
    ? "Section 13 of the Rent Restriction Act (Cap 296) and Kenyan legal precedent on the refund of deposits"
    : disputeType === "wrongful_eviction"
    ? "Section 4 of the Landlord and Tenant Act and Section 80 of the Land Registration Act 2012"
    : "Section 80 of the Land Registration Act 2012 governing repair covenants";

  return `ADVOCATE'S DEMAND LETTER & NOTICE OF INTENTION TO SUE

Date: ${new Date().toLocaleDateString("en-KE")}

TO:
${contract.landlordName.toUpperCase()}
Landlord of ${contract.apartmentName}
Phone: ${contract.landlordPhone}

RE: DEMAND REGARDING ${typeLabels[disputeType] || "LEASE DISPUTE"} (TENANT: ${contract.tenantName.toUpperCase()})

We act on behalf of our client, ${contract.tenantName} (the "Tenant"), under the legal custody and Retainer Protection program of LeaseGuardian / MakaziShield.

We are instructed that a dispute has arisen regarding:
"${description}"

TAKE NOTICE that your action constitutes a direct violation of Kenyan Law, specifically:
- ${lawsCited}.
- The covenant of quiet enjoyment implied in all tenancy agreements.

On behalf of our client, we hereby formally DEMAND that you remedy this breach immediately, and in any event within seven (7) days of the date of this letter, failing which we have instructions to file a formal dispute before the Rent Restriction Tribunal (RRT) or the Environment and Land Court of Kenya.

We shall seek:
1. Immediate compliance or recovery of the outstanding sum (KES ${disputeType === 'deposit_retention' ? contract.depositAmount : 'to be assessed'}).
2. Damages for inconvenience, illegal lockout, or utility disconnection.
3. Interest at Court rates.
4. All associated legal costs to be borne entirely by yourself.

Please avert a tedious and expensive litigation process by complying with this demand.

Yours Sincerely,
__________________________
WakaziShield Legal Team
Advocates for LeaseGuardian Custody Program
Nairobi, Kenya`;
}

async function seedFirestore() {
  if (!firestoreDb) return;
  try {
    const usersCol = collection(firestoreDb, "users");
    const usersSnapshot = await getDocs(usersCol);
    if (usersSnapshot.empty) {
      console.log("🌱 Seeding default users to Firestore...");
      const defaultUsers = [
        {
          id: "user-landlord-1",
          username: "landlord",
          password: "password",
          name: "Mwangi Kuria",
          role: "landlord"
        },
        {
          id: "user-tenant-1",
          username: "tenant",
          password: "password",
          name: "Chèrabelle Edith",
          role: "tenant"
        },
        {
          id: "user-lawyer-1",
          username: "lawyer",
          password: "password",
          name: "Wakili Sharon Odhiambo",
          role: "lawyer",
          firm: "Odhiambo & Co. Advocates"
        }
      ];
      for (const u of defaultUsers) {
        await setDoc(doc(firestoreDb, "users", u.id), u);
      }
    }

    const lawyersCol = collection(firestoreDb, "lawyers");
    const lawyersSnapshot = await getDocs(lawyersCol);
    if (lawyersSnapshot.empty) {
      console.log("🌱 Seeding pre-seeded lawyers to Firestore...");
      for (const l of preSeededLawyers) {
        await setDoc(doc(firestoreDb, "lawyers", l.id), l);
      }
    }

    const contractsCol = collection(firestoreDb, "contracts");
    const contractsSnapshot = await getDocs(contractsCol);
    if (contractsSnapshot.empty) {
      console.log("🌱 Seeding pre-seeded contracts to Firestore...");
      for (const c of preSeededContracts) {
        await setDoc(doc(firestoreDb, "contracts", c.id), c);
      }
    }

    const disputesCol = collection(firestoreDb, "disputes");
    const disputesSnapshot = await getDocs(disputesCol);
    if (disputesSnapshot.empty) {
      console.log("🌱 Seeding pre-seeded disputes to Firestore...");
      for (const d of preSeededDisputes) {
        await setDoc(doc(firestoreDb, "disputes", d.id), d);
      }
    }

    const marketStatsCol = collection(firestoreDb, "marketStats");
    const marketStatsSnapshot = await getDocs(marketStatsCol);
    if (marketStatsSnapshot.empty) {
      console.log("🌱 Seeding pre-seeded market stats to Firestore...");
      for (const s of preSeededMarketStats) {
        const statId = "stat-" + s.neighborhood.toLowerCase().replace(/[^a-z0-9]/g, "-");
        await setDoc(doc(firestoreDb, "marketStats", statId), { id: statId, ...s });
      }
    }

    console.log("🌱 Firestore seeding verified/completed.");
  } catch (err) {
    console.error("❌ Failed to seed Firestore database:", err);
  }
}

// Vite and static files setup
async function startServer() {
  // Test and seed Firestore on startup
  await testFirestoreConnection();
  await seedFirestore();

  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 LeaseGuardian backend server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
